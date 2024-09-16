/**
 * check if IndexedDB and Web Locks API supported
 */
export function isIdbSupported(): boolean {
  return "locks" in navigator;
}
