"use client";

import { useEffect } from "react";

export const CHECK_RETURN_KEY = "check:return";
const MAX_AGE_MS = 30 * 60 * 1000;

// Remembers where you were on 価格確認 when you open a detail page (the search, the filters, the
// 「もっと見る」 count and the scroll position) and scrolls back there when the same address opens
// again within 30 minutes (back gesture, back button or the 検索に戻る link).
export default function CheckScrollMemory() {
  useEffect(() => {
    const timers: number[] = [];
    try {
      const raw = sessionStorage.getItem(CHECK_RETURN_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      const here = window.location.pathname + window.location.search;
      if (
        saved &&
        saved.url === here &&
        typeof saved.y === "number" &&
        Date.now() - Number(saved.at) < MAX_AGE_MS
      ) {
        const go = () => window.scrollTo(0, saved.y);
        // Next.js may scroll to the top after the page opens, so scroll again a little later.
        requestAnimationFrame(go);
        timers.push(window.setTimeout(go, 120), window.setTimeout(go, 400));
      }
    } catch {
      // storage can be unavailable: then the page simply opens at the top
    }

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a");
      const href = link?.getAttribute("href") ?? "";
      if (!/^\/check\/[^/?#]+/.test(href)) return;
      try {
        sessionStorage.setItem(
          CHECK_RETURN_KEY,
          JSON.stringify({
            url: window.location.pathname + window.location.search,
            y: window.scrollY,
            len: window.history.length,
            at: Date.now(),
          })
        );
      } catch {
        // ignore
      }
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return null;
}