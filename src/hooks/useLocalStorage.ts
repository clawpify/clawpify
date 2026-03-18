import { useCallback, useState } from "react";

/**
 * Get a value from localStorage.
 *
 * @param key - The key to get.
 * @param initialValue - The initial value to return if the key is not found.
 * @returns The value from localStorage.
 */
function getStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;
  try {
    const item = window.localStorage.getItem(key);
    return item != null ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

/**
 * Set a value in localStorage.
 *
 * @param key - The key to set.
 * @param value - The value to set.
 */
function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/**
 * A generic hook for syncing state with localStorage.
 * Use for any key-value pair you want to persist across sessions.
 *
 * @param key - localStorage key
 * @param initialValue - fallback when key is missing or parse fails
 * @returns [value, setValue] - same API as useState; setValue accepts value or updater function
 *
 * @example
 * const [dismissed, setDismissed] = useLocalStorage("popup-dismissed", false);
 * const [prefs, setPrefs] = useLocalStorage("user-prefs", { theme: "light" });
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() =>
    getStoredValue(key, initialValue)
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        setStoredValue(key, next);
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}
