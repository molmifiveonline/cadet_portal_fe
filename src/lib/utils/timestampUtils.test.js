import { formatTimestampInIndia } from './timestampUtils';

it.each([
  ['2026-09-30T07:19:44.000Z', '30-09-2026', '12:49:44 PM'],
  ['2026-09-30T12:49:44+05:30', '30-09-2026', '12:49:44 PM'],
  ['2026-09-30T18:29:59Z', '30-09-2026', '11:59:59 PM'],
  ['2026-09-30T18:30:00Z', '01-10-2026', '12:00:00 AM'],
  ['2026-12-31T20:00:00Z', '01-01-2027', '01:30:00 AM'],
  [new Date('2026-09-30T07:19:44Z'), '30-09-2026', '12:49:44 PM'],
])('formats %s as the correct India date and time', (value, date, time) => {
  expect(formatTimestampInIndia(value)).toEqual({ date, time });
});

it.each([null, undefined, '', 'invalid'])(
  'handles unavailable timestamps (%s)',
  (value) => {
    expect(formatTimestampInIndia(value)).toEqual({ date: '-', time: '-' });
  },
);
