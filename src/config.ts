import path from "path"

const rootDir = path.resolve()
const distDir = path.join(rootDir, "dist")
const assetsDir = path.join(path.resolve(), "assets")
const dataDir = path.join(path.resolve(), "data")

const dbName = "db.sqlite3"
const dbPath = path.join(dataDir, dbName)
const migrationPath = path.join(dataDir, "/migrations")

const config = {
    dirs: {
        root: distDir,
        assets: assetsDir,
        data: dataDir,
    },
    db: {
        sqlite: {
            client: "sqlite3",
            connection: {
                filename: dbPath,
            },
            useNullAsDefault: true,
            migrations: {
                directory: migrationPath,
            },
        },
    },
}

export default config
