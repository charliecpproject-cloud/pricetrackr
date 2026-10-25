// Japanese greeting by Japan time.
export function greetingFor(date: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
  if (hour >= 5 && hour < 11) return "おはようございます";
  if (hour >= 11 && hour < 18) return "こんにちは";
  return "こんばんは";
}

// With a display name: 「おはようございます、たろうさん」. Without: the greeting only.
export function greetingText(
  name: string | null | undefined,
  date: Date = new Date(),
): string {
  const greeting = greetingFor(date);
  const trimmed = (name ?? "").trim();
  return trimmed ? `${greeting}、${trimmed}さん` : greeting;
}
