"use client";

import { useEffect, useRef, useState } from "react";

type Status = "starting" | "scanning" | "unsupported" | "denied" | "error";

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };

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

const IOS_UNSUPPORTED_MESSAGE =
  "iPhoneとiPadでは、カメラでのバーコード読み取りに対応していません。番号を入力してください。";

// All iPhone and iPad browsers use Safari's engine, which has no BarcodeDetector.
function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Reads a barcode with the camera. The video is processed on this device only;
// nothing is recorded or sent. Only the code text is passed to onDetected.
export default function BarcodeScanner({
  onDetected,
}: {
  onDetected: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const callbackRef = useRef(onDetected);
  const [status, setStatus] = useState<Status>("starting");
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

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

      // The torch button is offered only when the camera reports a torch.
      const track = stream.getVideoTracks()[0] ?? null;
      trackRef.current = track;
      const capabilities = track?.getCapabilities?.() as
        TorchCapabilities | undefined;
      if (capabilities?.torch) setTorchAvailable(true);

      setStatus("scanning");

      const detector = new Detector({ formats });
      const tick = async () => {
        if (cancelled) return;
        try {
          const found = await detector.detect(video);
          const value = found?.[0]?.rawValue;
          if (value) {
            // A short buzz where the device has one (Android). No sound.
            if (typeof navigator.vibrate === "function") navigator.vibrate(80);
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
      trackRef.current = null;
    };
  }, []);

  async function toggleTorch() {
    const track = trackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      // the torch could not be switched: keep the old state
    }
  }

  const showVideo = status === "starting" || status === "scanning";
  const message =
    status === "unsupported" && isIosDevice()
      ? IOS_UNSUPPORTED_MESSAGE
      : MESSAGES[status];

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
      {status === "scanning" && torchAvailable && (
        <button
          type="button"
          onClick={toggleTorch}
          className="h-12 w-full rounded-xl border border-line bg-panel px-4 text-sm font-medium text-stone-900"
        >
          {torchOn ? "ライトを消す" : "ライトをつける"}
        </button>
      )}
      <p role="status" className="text-sm text-stone-600">
        {message}
      </p>
    </div>
  );
}
