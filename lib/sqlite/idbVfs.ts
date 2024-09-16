import SQLiteAsyncESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
import { IDBBatchAtomicVFS } from "wa-sqlite/src/examples/IDBBatchAtomicVFS.js";
import type { BaseVfsOptions, SqliteOptions } from "./types";

export type IdbVfsOptions = BaseVfsOptions & {
  /**
   * @default 'idb-sqlite-vfs'
   */
  idbName?: string;
  /**
   * patched options for `navigator.locks.request()`
   * @default 'shared+hint'
   */
  lockPolicy?: "exclusive" | "shared" | "shared+hint";
  /**
   * timeout for the lock
   * @default Infinity
   */
  lockTimeout?: number;
};

/**
 * storage data in IndexedDB,
 * use IDBBatchAtomicVFS with `wa-sqlite-async.wasm` (larger than sync version), better compatibility
 * @param fileName db file name
 * @param options options
 * @example
 * ```ts
 * import { useIdbStorage } from '@subframe7536/sqlite-wasm/idb'
 * import { getAsyncWasmURL, initSQLite } from '@subframe7536/sqlite-wasm'
 *
 * // const url = 'https://cdn.jsdelivr.net/gh/rhashimoto/wa-sqlite@v0.9.9/dist/wa-sqlite-async.wasm'
 * const url = getAsyncWasmURL()
 *
 * const { run, changes, lastInsertRowId, close, sqlite, db } = await initSQLite(
 *   useIdbStorage('test', { url })
 * )
 * ```
 */
export async function useIdbStorage(
  fileName: string,
  options: IdbVfsOptions = {}
): Promise<SqliteOptions> {
  const {
    url,
    idbName = "idb-sqlite-vfs",
    lockPolicy = "shared+hint",
    lockTimeout = Infinity,
    readonly,
  } = options;
  const sqliteModule = await SQLiteAsyncESMFactory(
    url ? { locateFile: () => url } : undefined
  );
  const vfsOptions = { idbName, lockPolicy, lockTimeout };
  return {
    path: fileName.endsWith(".db") ? fileName : `${fileName}.db`,
    readonly,
    sqliteModule,
    vfsFn: IDBBatchAtomicVFS.create,
    vfsOptions,
  };
}
