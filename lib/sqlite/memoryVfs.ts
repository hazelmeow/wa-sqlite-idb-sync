import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite.mjs";
import { MemoryVFS } from "wa-sqlite/src/examples/MemoryVFS.js";
import type { BaseVfsOptions, SqliteOptions } from "./types";

export type MemoryVfsOptions = BaseVfsOptions;

export async function useMemoryStorage(
  options: BaseVfsOptions = {}
): Promise<SqliteOptions> {
  const sqliteModule = await SQLiteESMFactory(
    options.url ? { locateFile: () => options.url } : undefined
  );
  return {
    path: ":memory:",
    readonly: options.readonly,
    sqliteModule,
    vfsFn: (MemoryVFS as any).create,
  };
}
