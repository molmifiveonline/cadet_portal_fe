import { validateExcelData } from './submitExcelValidation';

describe('validateExcelData gender validation', () => {
  it('marks an empty Gender cell as an error during preview', () => {
    const result = validateExcelData(
      [{ Name: 'Cadet One', Gender: '' }],
      ['Name', 'Gender'],
    );

    expect(result.errorCount).toBe(1);
    expect(result.errors['0-Gender']).toBe(
      'Gender is a mandatory field and cannot be empty.',
    );
  });

  it('uses the same Male/Female constraint as server validation', () => {
    const result = validateExcelData(
      [{ Name: 'Cadet One', Sex: 'Unknown' }],
      ['Name', 'Sex'],
    );

    expect(result.errorCount).toBe(1);
    expect(result.errors['0-Sex']).toContain(
      'Gender must be either "Male" or "Female"',
    );
  });

  it('accepts gender values regardless of surrounding whitespace or case', () => {
    const result = validateExcelData(
      [{ Name: 'Cadet One', Gender: ' female ' }],
      ['Name', 'Gender'],
    );

    expect(result).toEqual({ errors: {}, errorCount: 0 });
  });
});
