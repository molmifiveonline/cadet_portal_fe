import { getOverallMedicalReportStatus } from './medicalReportStatus';

describe('getOverallMedicalReportStatus', () => {
  it('returns pass only when every medical report passes', () => {
    expect(
      getOverallMedicalReportStatus([
        { report_id: 'one', status: 'pass' },
        { report_id: 'two', status: 'Pass' },
      ]),
    ).toBe('pass');
  });

  it('returns pending when any report is pending or failed', () => {
    expect(
      getOverallMedicalReportStatus([
        { report_id: 'one', status: 'pass' },
        { report_id: 'two', status: 'pending' },
      ]),
    ).toBe('pending');
    expect(
      getOverallMedicalReportStatus([
        { report_id: 'one', status: 'pass' },
        { report_id: 'two', status: 'fail' },
      ]),
    ).toBe('pending');
  });

  it('returns pending when report results are empty or invalid', () => {
    expect(getOverallMedicalReportStatus([])).toBe('pending');
    expect(getOverallMedicalReportStatus(null)).toBe('pending');
    expect(getOverallMedicalReportStatus('invalid json')).toBe('pending');
  });

  it('supports report results returned as database JSON text', () => {
    expect(
      getOverallMedicalReportStatus(
        JSON.stringify([{ report_id: 'one', status: 'pass' }]),
      ),
    ).toBe('pass');
  });
});
