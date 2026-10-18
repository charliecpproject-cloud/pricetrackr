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

// 「今日 14:30」「昨日 19:00」「10/10 09:00」 in Japan time.
export function formatActivityTime(iso: string, now: Date = new Date()): string {
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
  return `${a.m}/${a.d} ${time}`;
}