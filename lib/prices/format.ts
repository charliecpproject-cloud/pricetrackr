import { counterLabel, isMeasureUnit } from "./unitWords";

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
 * パッケージサイズと単位からラベル文字列を作ります。
 * ml, L, g, kg は数字とスペースのあとに単位を付けます。例: (500, "ml") => "500 ml"
 * 数える単位（個・枚・袋・本・玉・パックなど）はスペースなしでその言葉を付けます。
 * 例: (6, "本") => "6本", (44, "sheet") => "44枚", (1, "count") => "1個"
 */
export function packageLabel(size: number | string, unit: string): string {
  const num = typeof size === "string" ? Number(size) : size;
  if (Number.isNaN(num)) {
    return "";
  }
  const numStr = num.toString();

  if (isMeasureUnit(unit)) {
    return `${numStr} ${unit}`;
  }
  return `${numStr}${counterLabel(unit)}`;
}
