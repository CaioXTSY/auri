const DEFAULT_TIME_ZONE = 'America/Sao_Paulo';

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const getDateParts = (date: Date, timeZone: string): DateParts => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = getDateParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
};

const zonedTimeToUtc = (
  parts: Omit<DateParts, 'hour' | 'minute' | 'second'> & {
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
  },
  timeZone: string,
) => {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
    parts.millisecond ?? 0,
  );

  let utc = localAsUtc - getTimeZoneOffsetMs(new Date(localAsUtc), timeZone);
  utc = localAsUtc - getTimeZoneOffsetMs(new Date(utc), timeZone);

  return new Date(utc);
};

export const getDailyQuizTimeZone = (configured?: string | null) =>
  configured?.trim() || DEFAULT_TIME_ZONE;

export const getDailyQuizDayKey = (now = new Date(), configuredTimeZone?: string | null) => {
  const timeZone = getDailyQuizTimeZone(configuredTimeZone);
  const { year, month, day } = getDateParts(now, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getDailyQuizDateWindow = (
  now = new Date(),
  configuredTimeZone?: string | null,
) => {
  const timeZone = getDailyQuizTimeZone(configuredTimeZone);
  const { year, month, day } = getDateParts(now, timeZone);

  return {
    startOfDay: zonedTimeToUtc({ year, month, day }, timeZone),
    endOfDay: zonedTimeToUtc(
      { year, month, day, hour: 23, minute: 59, second: 59, millisecond: 999 },
      timeZone,
    ),
    dayKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    timeZone,
  };
};
