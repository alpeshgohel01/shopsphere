"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Locks UI while an async action runs - prevents double submits / parallel clicks.
 *
 * Pass `{ keepBusy: true }` for redirect flows. Return `false` from `fn` to unlock
 * early (e.g. API error before a redirect).
 *
 * @returns {{
 *   busy: boolean,
 *   actionKey: string | boolean | null,
 *   is: (key: string) => boolean,
 *   run: <T>(fn: () => Promise<T>, keyOrOptions?: string | { key?: string, keepBusy?: boolean }) => Promise<T | undefined>,
 * }}
 */
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [actionKey, setActionKey] = useState(null);
  const busyRef = useRef(false);

  const clear = useCallback(() => {
    busyRef.current = false;
    setBusy(false);
    setActionKey(null);
  }, []);

  const run = useCallback(
    async (fn, keyOrOptions) => {
      if (busyRef.current) return undefined;

      const key =
        typeof keyOrOptions === "string"
          ? keyOrOptions
          : (keyOrOptions?.key ?? true);
      const keepBusy =
        typeof keyOrOptions === "object" && Boolean(keyOrOptions?.keepBusy);

      busyRef.current = true;
      setBusy(true);
      setActionKey(key);

      let stayLocked = false;
      try {
        const result = await fn();
        // keepBusy only sticks when fn did not opt out with `false`
        stayLocked = keepBusy && result !== false;
        return result;
      } catch (error) {
        stayLocked = false;
        throw error;
      } finally {
        if (!stayLocked) {
          clear();
        }
      }
    },
    [clear],
  );

  const is = useCallback((key) => actionKey === key, [actionKey]);

  return { busy, actionKey, is, run };
}
