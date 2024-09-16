# wa-sqlite-idb-sync

This package wraps `wa-sqlite` and provides a simplified interface and a way
to subscribe to queries across contexts.

It uses `IDBBatchAtomicVFS`, falling back to `MemoryVFS` when IndexedDB and
Web Locks are not supported.

Currently, detecting changes uses `sqlite3_update_hook` which is implemented in
[my fork of wa-sqlite](https://github.com/hazelmeow/wa-sqlite/tree/update-hook).
To build this package you'll need to checkout the `update-hook` branch, `make`,
and point the dependency in `package.json` to the correct place.

### Todo

* Vite bundles `wa-sqlite.wasm` and `wa-sqlite-async.wasm` from `wa-sqlite`
  which might be undesirable

## Examples

Basic usage:
```js
const sqlite = new SqliteSync("app.db");
const rows = sqlite.query('SELECT * FROM t WHERE x > 5');
```

Subscriptions:
```js
const sqlite = new SqliteSync("app.db");
sqlite.watch('SELECT * FROM t WHERE x > 5', [], (rows) => { /* ... */ });

// manually refresh all queries
sqlite.forceRefreshQueries();
```

As a React hook:
```js
const useWatchQuery = (sql, parameters) => {
	const [rows, setRows] = useState([]);
	useEffect(() => {
		const unsubscribe = sqlite.watch(sql, parameters, (r) => { setRows(r) });
		return () => {
			unsubscribe();
		}
	}, [sql, parameters]);
	return rows;
}
```

## References
* [rhashimoto/wa-sqlite](https://github.com/rhashimoto/wa-sqlite)
* Typescript wrapper code for `wa-sqlite` copied from [subframe7536/sqlite-wasm](https://github.com/subframe7536/sqlite-wasm)
  with modifications, licensed under MIT
