const parseReportResults = (reportResults) => {
  if (Array.isArray(reportResults)) return reportResults;
  if (typeof reportResults !== 'string' || !reportResults.trim()) return [];

  try {
    const parsed = JSON.parse(reportResults);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const getOverallMedicalReportStatus = (reportResults) => {
  const results = parseReportResults(reportResults);
  if (results.length === 0) return 'pending';

  const allPassed = results.every(
    (result) => String(result?.status || '').trim().toLowerCase() === 'pass',
  );

  return allPassed ? 'pass' : 'pending';
};
