export type Promisable<T> = T | Promise<T>;

export type BaseVfsOptions = {
  url?: string;
  readonly?: boolean;
};

export type SqliteOptions = {
  path: string;
  sqliteModule: any;
  vfsFn: (name: string, module: any, options?: any) => Promisable<SQLiteVFS>;
  vfsOptions?: any;
  readonly?: boolean;
};

export type Sqlite = {
  /**
   * file name (IDBBatchAtomicVFS) or directory path (AccessHandlePoolVFS)
   */
  path: string;
  /**
   * db pointer
   */
  db: number;
  /**
   * sqlite apis
   */
  sqlite: SQLiteAPI;
  /**
   * sqlite vfs
   */
  vfs: SQLiteVFS;
  /**
   * close db
   */
  close: () => Promise<void>;
  /**
   * get db changes
   */
  changes: () => number;
  /**
   * get lastInsertRowId
   */
  lastInsertRowId: () => Promise<number>;
  /**
   * run sql and return result list
   * @param onData trigger onn stream has data received
   * @param sql raw sql with placeholder
   * @param parameters params that replace the placeholder
   * @example
   * const results = await run('select ? from test where id = ?', ['name', 1])
   */
  stream: (
    onData: (data: Record<string, SQLiteCompatibleType>) => void,
    sql: string,
    parameters?: SQLiteCompatibleType[]
  ) => Promise<void>;
  /**
   * run sql and return result list
   * @param sql raw sql with placeholder
   * @param parameters params that replace the placeholder
   * @example
   * const results = await run('select ? from test where id = ?', ['name', 1])
   */
  run: (
    sql: string,
    parameters?: SQLiteCompatibleType[]
  ) => Promise<Array<Record<string, SQLiteCompatibleType>>>;
};
