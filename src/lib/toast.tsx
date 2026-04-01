import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = setTimeout(() => {
      setMessage(null);
      timerRef.current = null;
    }, 3500);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[200] max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-lg border border-zinc-200/90 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-800 shadow-[0_4px_24px_rgba(15,23,42,0.12),0_1px_3px_rgba(15,23,42,0.08)]"
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
