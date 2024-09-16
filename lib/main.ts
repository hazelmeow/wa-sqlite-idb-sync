import { initSqlite } from "./sqlite/core";
import { useIdbStorage } from "./sqlite/idbVfs";
import { useMemoryStorage } from "./sqlite/memoryVfs";
import { SqliteOptions, Sqlite } from "./sqlite/types";
import { isIdbSupported } from "./sqlite/utils";

export type SQLiteCompatibleType =
  | number
  | string
  | Uint8Array
  | Array<number>
  | bigint
  | null;

export type Listener = (
  rows: Array<Record<string, SQLiteCompatibleType>>
) => void;

type WatchedQuery = {
  sql: string;
  parameters: SQLiteCompatibleType[];
  listeners: Listener[];
  cached: Array<Record<string, SQLiteCompatibleType>> | null;
};

export type SqliteSyncOptions = {
  skipRecommendedPragmas: boolean;
};

/**
 * SqliteSync class
 *
 * `name` should be the same on all contexts for syncing to work.
 */
export class SqliteSync {
  private sqlite: Promise<Sqlite>;

  private watchedQueries: Array<WatchedQuery>;
  private broadcastChannel: BroadcastChannel;

  constructor(name: string, options?: SqliteSyncOptions) {
    const skipRecommendedPragmas = options?.skipRecommendedPragmas ?? false;

    let sqliteOptions: Promise<SqliteOptions>;
    if (isIdbSupported()) {
      sqliteOptions = useIdbStorage(name, {
        lockPolicy: "exclusive",
      });
    } else {
      console.warn(
        "SqliteSync: IndexedDB or Web Locks is not supported, falling back to memory VFS"
      );
      sqliteOptions = useMemoryStorage({});
    }

    this.sqlite = initSqlite(sqliteOptions);

    this.broadcastChannel = new BroadcastChannel(`SqliteSync_${name}`);
    this.broadcastChannel.addEventListener("message", () => {
      this.queueRefreshQueries();
    });

    this.sqlite.then((sqlite) => {
      // Recommended pragmas
      if (!skipRecommendedPragmas) {
        sqlite.run(`
            PRAGMA journal_mode=delete;
            PRAGMA synchronous=normal;
            PRAGMA cache_size=-5000;
        `);
      }

      // Install an update hook which is called when something is changed on this connection
      sqlite.sqlite.update_hook(
        sqlite.db,
        (
          _updateType: number,
          _db: string | null,
          _tbl: string | null,
          _rowid: bigint
        ) => {
          // console.log(`hook triggered for ${updateType} ${db} ${tbl} ${rowid}`);
          this.queueRefreshQueries();
          this.queueBroadcastRefresh();
        }
      );
    });

    this.watchedQueries = [];
  }

  /**
   * Query the database
   */
  public async query(
    sql: string,
    parameters?: SQLiteCompatibleType[]
  ): Promise<Array<Record<string, SQLiteCompatibleType>>> {
    const sqlite = await this.sqlite;

    const res = sqlite.run(sql, parameters);

    return res;
  }

  /**
   * Subscribe to a query
   *
   * Returns a function that will remove the listener when called.
   */
  public watch(
    sql: string,
    parameters: SQLiteCompatibleType[],
    listener: Listener
  ): () => void {
    // look for matching query
    const existing = this.watchedQueries.find((q) => {
      return q.sql === sql && parametersMatch(q.parameters, parameters);
    });

    if (existing) {
      // add to matching query
      existing.listeners.push(listener);

      // call listener with previous value
      if (existing.cached !== null) {
        listener(existing.cached);
      }

      // unsubscribe fn
      return () => {
        this.unwatchQuery(listener);
      };
    } else {
      // create a new query
      const query: WatchedQuery = {
        sql,
        parameters,
        cached: null,
        listeners: [listener],
      };
      this.watchedQueries.push(query);

      // query in background and then call listener(s)
      this.query(sql, parameters).then((data) => {
        const query = this.watchedQueries.find((q) => {
          return q.sql === sql && parametersMatch(q.parameters, parameters);
        });
        if (query) {
          query.cached = data;
          query.listeners.forEach((l) => l(data));
        }
      });

      // unsubscribe fn
      return () => {
        this.unwatchQuery(listener);
      };
    }
  }

  /**
   * Force refresh watched queries
   */
  public forceRefreshQueries() {
    this.queueRefreshQueries();
  }

  private unwatchQuery(listener: Listener) {
    for (let i = 0; i < this.watchedQueries.length; i++) {
      const query = this.watchedQueries[i];
      const idx = query.listeners.findIndex((l) => l === listener);
      if (idx === -1) continue;

      query.listeners.splice(idx, 1);

      if (query.listeners.length === 0) {
        // remove the whole query
        this.watchedQueries.splice(i, 1);
        i--;
      }
    }
  }

  // TODO: scope by table?
  private refreshQueries() {
    this.watchedQueries.forEach((query) => {
      this.query(query.sql, query.parameters).then((data) => {
        query.cached = data;
        query.listeners.forEach((l) => l(data));
      });
    });
  }

  private willRefreshQueries = false;
  private queueRefreshQueries() {
    if (this.willRefreshQueries) return false;

    this.willRefreshQueries = true;
    setTimeout(() => {
      this.refreshQueries();
      this.willRefreshQueries = false;
    }, 10);
  }

  private willBroadcastRefresh = false;
  private queueBroadcastRefresh() {
    if (this.willBroadcastRefresh) return false;

    this.willBroadcastRefresh = true;
    setTimeout(() => {
      this.broadcastChannel.postMessage({});
      this.willBroadcastRefresh = false;
    }, 10);
  }
}

const parametersMatch = (
  a: SQLiteCompatibleType[],
  b: SQLiteCompatibleType[]
): boolean => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
};
