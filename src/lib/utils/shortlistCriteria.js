const SHORTLIST_CRITERIA = {
  tenth_avg_percentage: 60,
  // tenth_std_maths: 60,
  // tenth_std_science: 60,
  // tenth_std_english: 60,
  twelfth_pcm_avg_percentage: 60,
  twelfth_std_english: 70,
};

const hasNumericValue = (value) => {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim();
  if (!normalized) return false;
  return !Number.isNaN(Number(normalized));
};

const meetsMinimum = (cadet, field) =>
  hasNumericValue(cadet?.[field]) &&
  Number(cadet[field]) >= SHORTLIST_CRITERIA[field];

export const hasRequiredTwelfthMarks = (cadet = {}) =>
  hasNumericValue(cadet.twelfth_pcm_avg_percentage) &&
  hasNumericValue(cadet.twelfth_std_english);

export const meetsShortlistCriteria = (cadet = {}) =>
  hasRequiredTwelfthMarks(cadet) &&
  meetsMinimum(cadet, "tenth_avg_percentage") &&
  // meetsMinimum(cadet, "tenth_std_maths") &&
  // meetsMinimum(cadet, "tenth_std_science") &&
  // meetsMinimum(cadet, "tenth_std_english") &&
  meetsMinimum(cadet, "twelfth_pcm_avg_percentage") &&
  meetsMinimum(cadet, "twelfth_std_english");

export const getShortlistCriteriaStatus = (cadet = {}) => {
  if (!hasRequiredTwelfthMarks(cadet)) {
    return {
      type: "missing_twelfth",
      label: "12th marks pending",
      rowClassName: "bg-amber-50/70 hover:bg-amber-100/70",
      badgeClassName: "bg-amber-100 text-amber-800",
    };
  }

  if (meetsShortlistCriteria(cadet)) {
    return {
      type: "passed",
      label: "Eligible",
      rowClassName: "bg-emerald-50/70 hover:bg-emerald-100/70",
      badgeClassName: "bg-emerald-100 text-emerald-800",
    };
  }

  return {
    type: "failed",
    label: "Not eligible",
    rowClassName: "bg-rose-50/70 hover:bg-rose-100/70",
    badgeClassName: "bg-rose-100 text-rose-800",
  };
};

export { SHORTLIST_CRITERIA };
