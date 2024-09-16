import { SqliteSync } from "../lib/main";
import "./style.css";

const sqlite = new SqliteSync("app_v1.db");

const logs: string[] = [];

const timeTest = async (name: string, f: () => Promise<void>) => {
  const startTime = performance.now();
  try {
    await f();
  } catch (e) {
    logs.push(`${name} error: ${e}`);
    console.error(e);
  }
  const endTime = performance.now();
  logs.push(`${name} took ${endTime - startTime}ms`);
  render();
};

const tests = {
  setup: async () => {
    await sqlite.query(
      "DROP TABLE IF EXISTS mytable; CREATE TABLE mytable(id, data);"
    );
    //   .then((r) => console.log("setup res", r));
  },
  "insert 1x": async () => {
    await sqlite.query(
      `INSERT INTO mytable (id, data) VALUES (${Math.floor(
        Math.random() * 100000
      )}, 'asdf')`
    );
  },
  "insert 10x": async () => {
    for (let i = 0; i < 10; i++) {
      await sqlite.query(
        `INSERT INTO mytable (id, data) VALUES (${Math.floor(
          Math.random() * 100000
        )}, 'asdf')`
      );
      //   await new Promise((resolve) => setTimeout(resolve, 0));
      // .then((r) => console.log("insert res", r));
    }
  },
  "insert 1000x": async () => {
    for (let i = 0; i < 1000; i++) {
      await sqlite.query(
        `INSERT INTO mytable (id, data) VALUES (${Math.floor(
          Math.random() * 100000
        )}, 'asdf')`
      );
      //   await new Promise((resolve) => setTimeout(resolve, 0));
      // .then((r) => console.log("insert res", r));
    }
  },
  count: async () => {
    await sqlite.query(`SELECT COUNT(1) FROM mytable`).then(console.log);
  },
  "select 1 1x": async () => {
    await sqlite.query(`SELECT * FROM mytable LIMIT 1`);
  },
  "select 1 100x series": async () => {
    for (let i = 0; i < 100; i++) {
      await sqlite.query(`SELECT * FROM mytable LIMIT 1`);
    }
  },
  "select 1 100x parallel": async () => {
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(sqlite.query(`SELECT * FROM mytable LIMIT 1`));
    }
    await Promise.all(promises);
  },
  "select all 1x": async () => {
    await sqlite.query(`SELECT * FROM mytable`);
  },
  "select all 100x series": async () => {
    for (let i = 0; i < 100; i++) {
      await sqlite.query(`SELECT * FROM mytable`);
      // .then((r) => console.log("select res", r));
    }
  },
  "select all 100x parallel": async () => {
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        sqlite.query(`SELECT * FROM mytable`)
        //   .then((r) => console.log("select res", r))
      );
    }
    await Promise.all(promises);
  },
};

let rowCount = 0;
sqlite.watch("SELECT COUNT(*) as count FROM mytable", [], (data) => {
  console.log("count is ", data[0].count);
  rowCount = data[0].count as number;
  render();
});

// @ts-expect-error
window.test = (name: string) => timeTest(name, tests[name]);

const render = async () => {
  const app = await (
    <div>
      <h1>test</h1>

      <p>row count: {rowCount}</p>

      {Object.keys(tests).map((k) => (
        <button onclick={`window.test('${k}')`}>{k}</button>
      ))}

      <br></br>

      <textarea readonly>{logs.join("\n")}</textarea>

      <pre></pre>
    </div>
  );

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = app;
};

render();
