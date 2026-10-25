"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";

// A popup with the camera reader, used from the barcode boxes in forms.
export default function BarcodeScanModal({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="バーコードを読み取る"
    >
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative w-full max-w-xl rounded-t-3xl border border-line bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-stone-900">
            バーコードを読み取る
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <BarcodeScanner onDetected={onDetected} />
        <p className="mt-3 text-xs text-stone-500">
          映像はこの端末の中だけで処理され、保存・送信されません。
        </p>
      </div>
    </div>
  );
}
