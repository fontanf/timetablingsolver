// An in-memory SQLite database behind the subset of the interface of
// Cloudflare D1 used by 'server/api.js'. Requires 'node:sqlite' (Node 22.13+):
// the tests using it are skipped otherwise ('hasSqlite').

let DatabaseSync = null;
try {
    ({DatabaseSync} = await import("node:sqlite"));
} catch (error) {
    // Not available.
}

export const hasSqlite = DatabaseSync !== null;

export class FakeD1 {
    constructor() {
        this.sqlite = new DatabaseSync(":memory:");
    }

    prepare(sql) {
        return new FakeStatement(this.sqlite, sql, []);
    }
}

class FakeStatement {
    constructor(sqlite, sql, values) {
        this.sqlite = sqlite;
        this.sql = sql;
        this.values = values;
    }

    bind(...values) {
        return new FakeStatement(this.sqlite, this.sql, values);
    }

    async first() {
        return this.sqlite.prepare(this.sql).get(...this.values) ?? null;
    }

    async all() {
        return {results: this.sqlite.prepare(this.sql).all(...this.values)};
    }

    async run() {
        this.sqlite.prepare(this.sql).run(...this.values);
        return {success: true};
    }
}
