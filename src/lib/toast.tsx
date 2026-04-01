import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ActionToastPayload = {
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
  /** Falls back to `message` */
  ariaLabel?: string;
};

type ToastContextValue = {
  showToast: (message: string) => void;
  setActionToast: (payload: ActionToastPayload | null) => void;
};

type ActionToastState =
  | { status: "idle" }
  | { status: "visible"; payload: ActionToastPayload }
  | { status: "exiting"; payload: ActionToastPayload };

const ToastContext = createContext<ToastContextValue | null>(null);

const ACTION_EXIT_MS = 280;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const SURFACE =
  "rounded-lg border border-zinc-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.12),0_1px_3px_rgba(15,23,42,0.08)]";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionToastState>({ status: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = setTimeout(() => {
      setMessage(null);
      timerRef.current = null;
    }, 3500);
  }, []);

  const setActionToast = useCallback((payload: ActionToastPayload | null) => {
    setActionState((prev) => {
      if (payload !== null) {
        return { status: "visible", payload };
      }
      if (prev.status === "visible") return { status: "exiting", payload: prev.payload };
      if (prev.status === "exiting") return prev;
      return { status: "idle" };
    });
  }, []);

  useEffect(() => {
    if (actionState.status !== "exiting") return;
    const t = setTimeout(() => {
      setActionState({ status: "idle" });
    }, ACTION_EXIT_MS);
    return () => clearTimeout(t);
  }, [actionState]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const actionBarActive = actionState.status !== "idle";
  /** Closer to the bottom edge; ephemeral stacks above when both visible */
  const ephemeralBottom = actionBarActive ? "bottom-28" : "bottom-6";

  const actionPayload =
    actionState.status === "visible" || actionState.status === "exiting" ? actionState.payload : null;
  const actionAnimClass =
    actionState.status === "exiting" ? "animate-toast-action-out" : "animate-toast-action-in";

  return (
    <ToastContext.Provider value={{ showToast, setActionToast }}>
      {children}
      {actionPayload
        ? createPortal(
            <div
              role="region"
              aria-label={actionPayload.ariaLabel ?? actionPayload.message}
              className={`fixed bottom-6 left-1/2 z-[340] flex w-[min(90vw,28rem)] flex-wrap items-center justify-center gap-3 px-4 py-3 text-sm text-zinc-800 ${SURFACE} ${actionAnimClass}`}
            >
              <p className="min-w-0 flex-1 text-center font-medium sm:text-left">{actionPayload.message}</p>
              <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={actionPayload.secondaryDisabled === true}
                  onClick={actionPayload.onSecondary}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionPayload.secondaryLabel}
                </button>
                <button
                  type="button"
                  disabled={actionPayload.primaryDisabled === true}
                  onClick={actionPayload.onPrimary}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionPayload.primaryLabel}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
      {message
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className={`animate-toast-ephemeral-in fixed left-1/2 z-[341] max-w-[min(90vw,24rem)] -translate-x-1/2 px-4 py-2.5 text-center text-sm font-medium text-zinc-800 ${ephemeralBottom} ${SURFACE}`}
            >
              {message}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}
