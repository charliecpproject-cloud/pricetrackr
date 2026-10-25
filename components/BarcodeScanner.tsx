"use client";

import { useEffect, useRef, useState } from "react";

type Status = "starting" | "scanning" | "unsupported" | "denied" | "error";

const WANTED_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];

const MESSAGES: Record<Status, string> = {
  starting: "カメラを起動しています…",
  scanning: "バーコードを枠に合わせてください",
  unsupported:
    "このブラウザはカメラでのバーコード読み取りに対応していません。番号を入力してください。",
  denied:
    "カメラの使用が許可されていません。ブラウザの設定でカメラを許可してください。",
  error: "カメラを使えませんでした。番号を入力してください。",
};

// Reads a barcode with the camera. The video is processed on this device only;
// nothing is recorded or sent. Only the code text is passed to onDetected.
export default function BarcodeScanner({
  onDetected,
}: {
  onDetected: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callbackRef = useRef(onDetected);
  const [status, setStatus] = useState<Status>("starting");

  useEffect(() => {
    callbackRef.current = onDetected;
  });

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function start() {
      const Detector = (window as any).BarcodeDetector;
      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }

      let formats = WANTED_FORMATS;
      try {
        const supported: string[] = await Detector.getSupportedFormats();
        formats = WANTED_FORMATS.filter((f) => supported.includes(f));
      } catch {
        // keep the wanted list
      }
      if (formats.length === 0) {
        setStatus("unsupported");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        setStatus("error");
        return;
      }
      setStatus("scanning");

      const detector = new Detector({ formats });
      const tick = async () => {
        if (cancelled) return;
        try {
          const found = await detector.detect(video);
          const value = found?.[0]?.rawValue;
          if (value) {
            callbackRef.current(String(value));
            return;
          }
        } catch {
          // this frame could not be read: try the next one
        }
        timer = setTimeout(tick, 250);
      };
      tick();
    }

    start();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const showVideo = status === "starting" || status === "scanning";

  return (
    <div className="space-y-3">
      <div
        className={`relative overflow-hidden rounded-2xl bg-black ${showVideo ? "" : "hidden"}`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-[4/3] w-full object-cover"
        />
        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-x-[10%] top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-white/80" />
        )}
      </div>
      <p role="status" className="text-sm text-stone-600">
        {MESSAGES[status]}
      </p>
    </div>
  );
}
