const indiaDateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const indiaTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

// API timestamps carry an explicit UTC/offset suffix. Keep calendar-only date
// formatting separate so midnight rollover follows India time for both parts.
export const formatTimestampInIndia = (value) => {
  const timestamp = value ? new Date(value) : new Date(NaN);
  if (Number.isNaN(timestamp.getTime())) return { date: '-', time: '-' };

  const parts = Object.fromEntries(
    indiaDateFormatter
      .formatToParts(timestamp)
      .map(({ type, value }) => [type, value]),
  );
  return {
    date: `${parts.day}-${parts.month}-${parts.year}`,
    time: indiaTimeFormatter.format(timestamp).toUpperCase(),
  };
};
