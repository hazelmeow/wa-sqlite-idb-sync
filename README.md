# wa-sqlite-idb-sync

This package wraps `wa-sqlite` and provides a simplified interface and a way
to subscribe to queries across contexts.

It uses `IDBBatchAtomicVFS`, falling back to `MemoryAsyncVFS` when IndexedDB and
Web Locks are not supported.

Currently, detecting changes uses `sqlite3_update_hook` which I implemented in
[my fork of wa-sqlite](https://github.com/hazelmeow/wa-sqlite/tree/update-hook).
A build of the `update-hook` branch is vendored in `vendor/wa-sqlite/`.

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

## Future Improvements
* Detect what tables are queried/changed and selectively invalidate them?
* The stock IndexedDB VFS maybe has some problems? I have ran into a few runtime errors.
* It would be nice if `wa-sqlite` was written in TypeScript and packaged more typically.
  We could maybe get rid of the vendoring.

## References
* [rhashimoto/wa-sqlite](https://github.com/rhashimoto/wa-sqlite)
* Typescript wrapper code for `wa-sqlite` copied from [subframe7536/sqlite-wasm](https://github.com/subframe7536/sqlite-wasm)
  with modifications, licensed under MIT
