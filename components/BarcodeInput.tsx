"use client";

import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { controlCls } from "@/components/FormParts";
import BarcodeScanModal from "@/components/BarcodeScanModal";

// A text box for one barcode with a camera button next to it.
// The box is a plain (uncontrolled) input, so forms can clear it as usual.
export default function BarcodeInput({
  id,
  name,
  defaultValue = "",
  placeholder = "例：4901234567894",
}: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={id}
          name={name}
          inputMode="numeric"
          autoComplete="off"
          maxLength={40}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={controlCls}
        />
        <button
          type="button"
          aria-label="カメラで読み取る"
          onClick={() => setScanning(true)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-panel text-stone-600 active:scale-95"
        >
          <ScanLine className="h-5 w-5" />
        </button>
      </div>
      {scanning && (
        <BarcodeScanModal
          onClose={() => setScanning(false)}
          onDetected={(code) => {
            if (inputRef.current) inputRef.current.value = code;
            setScanning(false);
          }}
        />
      )}
    </>
  );
}
