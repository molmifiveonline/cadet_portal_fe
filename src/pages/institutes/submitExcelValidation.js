// Date column keywords (case-insensitive match) for validation
const DATE_COLUMN_KEYWORDS = ['date of birth', 'dob', 'birth date'];

// Standard column keywords to identify header row
export const HEADER_KEYWORDS = [
  'name',
  'email',
  'contact',
  'date_of_birth',
  'dob',
  'gender',
  'batch',
];

export const validateFileType = (file) => {
  if (!file) return 'Please select a file';
  const name = file.name.toLowerCase();
  if (
    !name.endsWith('.xlsx') &&
    !name.endsWith('.xls') &&
    !name.endsWith('.csv')
  ) {
    return 'Please upload a valid Excel or CSV file';
  }
  return '';
};

export const findHeaderRowIndex = (json) => {
  for (let i = 0; i < Math.min(json.length, 20); i++) {
    const row = json[i];
    if (!row || row.length === 0) continue;

    const matchCount = row.filter((cell) => {
      if (!cell) return false;
      const cellStr = String(cell).toLowerCase();
      return HEADER_KEYWORDS.some((k) => cellStr.includes(k));
    }).length;

    if (matchCount >= 2) {
      return i;
    }
  }
  return -1;
};

// Check if a header is a date column
export const isDateColumn = (header) => {
  if (!header) return false;
  const lower = header.toLowerCase();
  return DATE_COLUMN_KEYWORDS.some((kw) => lower === kw || lower.includes(kw));
};

// Check if a value is a valid date in dd-mm-yyyy format (dashes only)
export const isValidDate = (value) => {
  if (!value) return false;
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return false;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  return true;
};

// Check if a header relates to 10th or 12th marks/percentage
export const isMarksColumn = (header) => {
  if (!header) return false;
  const lower = header.toLowerCase();
  return (
    lower.includes('10') ||
    lower.includes('12') ||
    lower.includes('mark') ||
    lower.includes('percent') ||
    lower.includes('x') ||
    lower.includes('xii')
  );
};

// Format cell value for display — show EXACTLY as-is from Excel, no conversion
export const formatCellValue = (value, header) => {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
};

/**
 * Validate all rows against headers.
 * Returns { errors, errorCount } where errors is a map of "rowIdx-header" -> error message.
 */
export const validateExcelData = (rows, headers) => {
  const errors = {};
  let errorCount = 0;

  rows.forEach((row, rowIdx) => {
    headers.forEach((header) => {
      if (!header) return;

      const value = row[header];

      if (isDateColumn(header)) {
        // Allow empty dates, but if present must be dd-mm-yyyy
        if (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          !isValidDate(value)
        ) {
          const key = `${rowIdx}-${header}`;
          errors[key] = `Invalid format. Must be dd-mm-yyyy (e.g., 24-04-2005)`;
          errorCount++;
        }
      }

      if (isMarksColumn(header)) {
        // Prevent '%' sign in marks/percentage columns
        if (
          value !== undefined &&
          value !== null &&
          String(value).includes('%')
        ) {
          const key = `${rowIdx}-${header}`;
          errors[key] = `Please enter marks without '%' sign`;
          errorCount++;
        }
      }
    });
  });

  return { errors, errorCount };
};
