import { MAX_UNIT_LENGTH } from "./unitWords";

export const MAX_COUNTER_WORDS = 30;

const RESERVED = ["ml", "l", "g", "kg", "count", "sheet", "bag"];

/**
 * Checks a new counter word typed by an admin: letters only (kanji, kana, Latin), up to 8
 * characters, no spaces, digits or symbols, and not a measure or an old key. The word is
 * returned in normal form (NFKC), for example half-width katakana become full-width.
 */
export function parseNewCounterWord(
  raw: string
): { ok: true; word: string } | { ok: false; error: string } {
  const word = raw.normalize("NFKC").trim();
  if (word === "") return { ok: false, error: "言葉を入力してください" };
  if (/\s/.test(word)) return { ok: false, error: "言葉に空白は使えません" };
  if ([...word].length > MAX_UNIT_LENGTH) {
    return { ok: false, error: `言葉は${MAX_UNIT_LENGTH}文字以内で入力してください` };
  }
  if (!/^[\p{L}\p{M}]+$/u.test(word)) {
    return { ok: false, error: "文字だけで入力してください（数字や記号は使えません）" };
  }
  if (RESERVED.includes(word.toLowerCase())) {
    return { ok: false, error: "この言葉は使えません" };
  }
  return { ok: true, word };
}