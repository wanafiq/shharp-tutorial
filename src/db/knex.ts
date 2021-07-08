import Knex from "knex"
import fs from "fs"
import path from "path"

import config from "../config"
import * as quotes from "./quotes"

export const knexInstance = Knex(config.db.sqlite)

const dbPath = config.db.sqlite.connection.filename

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
    const tableExist = await knexInstance.schema.hasTable(quotes.tableName)

    if (!tableExist) {
        await knexInstance.schema.createTable(quotes.tableName, (table) => {
            table.bigIncrements("id").unsigned().primary()
            table.text("quote").notNullable()
            table.string("author", 512).notNullable()
            table.string("category", 512).notNullable()
            table.boolean("processed").notNullable()
        })
    }
}

export default knexInstance
