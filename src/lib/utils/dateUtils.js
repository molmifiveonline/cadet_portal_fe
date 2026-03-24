/**
 * Formats a date string into YYYY-MM-DD for HTML date inputs.
 * @param {string|Date} date - The date to format.
 * @returns {string} - Formatted date string or empty string if invalid.
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
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
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};
