/**
 * Tiny typed event bus built on the native EventTarget so it integrates
 * with DevTools and avoids reinventing pub/sub. Use for decoupled
 * cross-component signals (e.g. sidebar collapsed state, toast intents).
 */

export interface AppEventMap {
  'sidebar:toggle': { collapsed: boolean };
  'book:added': { bookId: string };
  'book:removed': { bookId: string };
  'book:updated': { bookId: string };
  'session:completed': { bookId: string; minutes: number };
  'theme:changed': { palette: string };
}

type AppEventName = keyof AppEventMap;

const target = new EventTarget();

export const emitEvent = <K extends AppEventName>(name: K, payload: AppEventMap[K]) => {
  target.dispatchEvent(new CustomEvent(name, { detail: payload }));
};

export const onEvent = <K extends AppEventName>(
  name: K,
  handler: (payload: AppEventMap[K]) => void,
): (() => void) => {
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  target.addEventListener(name, listener);
  return () => target.removeEventListener(name, listener);
};