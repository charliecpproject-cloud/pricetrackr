"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BarcodeScanner from "@/components/BarcodeScanner";
import { controlCls } from "@/components/FormParts";
import { lookupBarcode } from "./actions";

export default function ScanClient() {
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [manual, setManual] = useState("");

  const handle = useCallback(
    async (raw: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setMessage(null);

      const result = await lookupBarcode(raw);
      if (result.status === "found") {
        router.push(`/prices/new?product=${result.productId}`);
        return;
      }
      if (result.status === "not_found") {
        router.push(`/products?barcode=${encodeURIComponent(result.code)}`);
        return;
      }

      setMessage(result.message);
      busyRef.current = false;
      setBusy(false);
      setScannerKey((k) => k + 1); // start the camera again
    },
    [router]
  );

  return (
    <div className="space-y-6">
      <BarcodeScanner key={scannerKey} onDetected={handle} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handle(manual);
        }}
        className="space-y-2"
      >
        <label htmlFor="manual_barcode" className="block text-sm font-medium text-stone-700">
          番号を入力して探す
        </label>
        <div className="flex gap-2">
          <input
            id="manual_barcode"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            maxLength={40}
            placeholder="例：4901234567894"
            className={controlCls}
          />
          <Button type="submit" disabled={busy || manual.trim() === ""} className="h-12 shrink-0 px-5">
            探す
          </Button>
        </div>
      </form>

      {busy && <p className="text-sm text-stone-600">探しています…</p>}
      {message && <p className="text-sm text-red-600">{message}</p>}

      <p className="text-xs text-stone-500">
        カメラの映像はこの端末の中だけで処理され、保存も送信もされません。読み取った番号だけを使います。
      </p>
    </div>
  );
}