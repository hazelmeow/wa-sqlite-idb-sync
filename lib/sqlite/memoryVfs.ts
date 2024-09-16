import SQLiteAsyncESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
import { MemoryAsyncVFS } from "wa-sqlite/src/examples/MemoryAsyncVFS.js";
import type { BaseVfsOptions, SqliteOptions } from "./types";

export type MemoryVfsOptions = BaseVfsOptions;

export async function useMemoryStorage(
  options: BaseVfsOptions = {}
): Promise<SqliteOptions> {
  const sqliteModule = await SQLiteAsyncESMFactory(
    options.url ? { locateFile: () => options.url } : undefined
  );
  return {
    path: ":memory:",
    readonly: options.readonly,
    sqliteModule,
    vfsFn: (MemoryAsyncVFS as any).create,
  };
}
