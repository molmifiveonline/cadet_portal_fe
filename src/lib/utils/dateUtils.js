/**
 * Formats a date string into YYYY-MM-DD for HTML date inputs.
 * @param {string|Date} date - The date to format.
 * @returns {string} - Formatted date string or empty string if invalid.
 */
export const formatDateForInput = (date) => {
  const d = parseDateValue(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date string into DD/MM/YYYY for display.
 * @param {string|Date} date - The date to format.
 * @returns {string} - Formatted date string or '-' if invalid.
 */
export const formatDateForDisplay = (date) => {
  const d = parseDateValue(date);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const parseDateValue = (date) => {
  if (!date) return new Date(NaN);
  if (date instanceof Date) return date;

  const value = String(date).trim();
  if (!value) return new Date(NaN);

  const isoDate = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (isoDate) {
    return new Date(
      Number(isoDate[1]),
      Number(isoDate[2]) - 1,
      Number(isoDate[3]),
    );
  }

  const dayFirstDate = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dayFirstDate) {
    const day = Number(dayFirstDate[1]);
    const month = Number(dayFirstDate[2]);
    const year = Number(dayFirstDate[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
  }

  return new Date(value);
};
