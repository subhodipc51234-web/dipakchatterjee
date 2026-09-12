// lib/hooks/useHydrated.ts
//
// True only after the client has hydrated. Several dashboard managers
// (drag-and-drop lists built on @dnd-kit) render an `aria-describedby`
// attribute that dnd-kit only fills in on the client — rendering it
// unconditionally would mismatch the server's markup on first paint, so
// each of those defers to this and renders the plain, attribute-free
// version until it flips to true.
//
// Implemented with useSyncExternalStore instead of the more familiar
// `useState(false)` + `useEffect(() => setState(true), [])` pattern:
// the server/client snapshots below already encode "false during SSR
// and the first client render, true after" directly, so there's no
// separate render-then-setState-then-render-again step — one extra
// effect and one extra render disappear.
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
