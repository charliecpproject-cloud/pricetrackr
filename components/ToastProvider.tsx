"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type Kind = "success" | "error";
export type ToastLink = { href: string; label: string };
type Toast = { id: number; text: string; kind: Kind; link?: ToastLink };
type Api = { showToast: (text: string, kind?: Kind, link?: ToastLink) => void };

const SUCCESS_MS = 3000;
const ERROR_MS = 5000; // errors take longer to read
const LINK_MS = 7000; // a toast with a link stays long enough to tap
const MAX_TOASTS = 3;

// Outside the provider this does nothing instead of crashing.
const Ctx = createContext<Api>({ showToast: () => {} });

export function useToast(): Api {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (text: string, kind: Kind = "success", link?: ToastLink) => {
      const id = nextId.current++;
      setToasts((current) =>
        [...current, { id, text, kind, link }].slice(-MAX_TOASTS),
      );
      timers.current.set(
        id,
        setTimeout(
          () => dismiss(id),
          kind === "error" ? ERROR_MS : link ? LINK_MS : SUCCESS_MS,
        ),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  const api = useMemo<Api>(() => ({ showToast }), [showToast]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-[90] mx-auto flex max-w-xl flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
              t.kind === "error" ? "bg-red-600" : "bg-emerald-600"
            }`}
          >
            {t.kind === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 break-words">
              {t.text}
              {t.link && (
                <Link
                  href={t.link.href}
                  onClick={() => dismiss(t.id)}
                  className="ml-2 inline-block font-bold underline"
                >
                  {t.link.label}
                </Link>
              )}
            </span>
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
