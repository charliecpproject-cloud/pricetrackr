/**
 * 金額を日本円表記にフォーマットします。
 * 例: 1280 => "¥1,280", 98.5 => "¥98.5"
 */
export function formatYen(amount: number | string): string {
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(num)) {
    return "";
  }
  // 小数部が必要な場合は最大 20 桁まで表示し、末尾の 0 は自動で除去されます。
  const formatted = num.toLocaleString("en-US", {
    maximumFractionDigits: 20,
  });
  return `¥${formatted}`;
}

/**
 * ISO 8601 文字列を Asia/Tokyo タイムゾーンで
 * "YYYY/MM/DD HH:mm" 形式に変換します。
 */
export function formatJst(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  const year = lookup["year"];
  const month = lookup["month"];
  const day = lookup["day"];
  const hour = lookup["hour"];
  const minute = lookup["minute"];

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

/**
 * パッケージサイズと単位からラベル文字列を作ります。
 * 例: (500, "ml") => "500 ml", ("1000.0", "ml") => "1000 ml"
 * 「count」または「個」の場合はスペースなしで「個」を付与します。
 */
export function packageLabel(size: number | string, unit: string): string {
  const num = typeof size === "string" ? Number(size) : size;
  if (Number.isNaN(num)) {
    return "";
  }
  const numStr = Number.isInteger(num) ? num.toString() : num.toString();

  // 「count」または「個」のときは「個」をスペースなしで付ける
  if (unit === "count" || unit === "個") {
    return `${numStr}個`;
  }

  return `${numStr} ${unit}`;
}
