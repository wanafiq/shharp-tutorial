import Knex from "knex"
import fs from "fs"
import path from "path"

import config from "../config"
import * as quotes from "./quotes"

const assetsDir = config.dirs.assets
const dbName = "db.sqlite3"
const dbPath = path.join(`${assetsDir}`, "data", `${dbName}`)
const migrationPath = path.join(`${assetsDir}`, "data", `/migrations`)

export const knexInstance = Knex({
    client: "sqlite3",
    connection: {
        filename: dbPath,
    },
    useNullAsDefault: true,
    migrations: {
        directory: migrationPath,
    },
})

export async function runSqliteMigration() {
    await createSqliteDb()
}

export function isSqliteDbExist() {
    try {
        if (fs.existsSync(dbPath)) {
            return true
        }
    } catch (err) {
        return false
    }

    return false
}

async function createSqliteDb() {
    fs.writeFile(dbPath, "", (err) => {
        if (err) {
            throw new Error(`Failed to create sqlite at ${dbPath}. ${err}`)
        }

        console.log(`sqlite db created`)
    })

    await createQuotesTable()
}

async function createQuotesTable() {
    await knexInstance.schema.createTableIfNotExists(
        quotes.tableName,
        (table) => {
            table.bigIncrements("id").unsigned().primary()
            table.text("quote").notNullable()
            table.string("author", 512).notNullable()
            table.string("category", 512).notNullable()
            table.boolean("processed").notNullable()
        }
    )
}

export default knexInstance
