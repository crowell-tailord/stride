import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * React 18/19 compliant hook to determine if the component has mounted on the client.
 * Uses useSyncExternalStore to eliminate cascading re-renders and ESLint set-state-in-effect errors.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
