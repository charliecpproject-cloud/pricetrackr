function jstParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    hh: get("hour"),
    mm: get("minute"),
  };
}

// The one way to show a date and time in the app, always in Japan time:
// 「今日 14:30」「昨日 19:00」「10/20 19:18」(this year) or 「2025/12/20 19:18」(another year).
export function formatDateTime(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const a = jstParts(at);
  const b = jstParts(now);
  const dayNumber = (p: { y: number; m: number; d: number }) =>
    Date.UTC(p.y, p.m - 1, p.d) / 86_400_000;
  const diff = dayNumber(b) - dayNumber(a);
  const time = `${a.hh}:${a.mm}`;
  if (diff === 0) return `今日 ${time}`;
  if (diff === 1) return `昨日 ${time}`;
  if (a.y === b.y) return `${a.m}/${a.d} ${time}`;
  return `${a.y}/${a.m}/${a.d} ${time}`;
}
// The same without the time: 「今日」「昨日」「10/20」「2025/12/20」 in Japan time.
export function formatDate(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const a = jstParts(at);
  const b = jstParts(now);
  const dayNumber = (p: { y: number; m: number; d: number }) =>
    Date.UTC(p.y, p.m - 1, p.d) / 86_400_000;
  const diff = dayNumber(b) - dayNumber(a);
  if (diff === 0) return "今日";
  if (diff === 1) return "昨日";
  if (a.y === b.y) return `${a.m}/${a.d}`;
  return `${a.y}/${a.m}/${a.d}`;
}