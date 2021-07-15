import { knex, Knex } from "knex"

import config from "../config"

const dbName = "sqlite3"
const tableName = "quotes"

export function getKnex(path: string) {
    const opt = {
        client: dbName,
        connection: {
            filename: path,
        },
        useNullAsDefault: true,
        migrations: {
            directory: config.paths.migration,
        },
    }

    try {
        const instance = knex(opt)
        return instance
    } catch (err) {
        console.error(err)
    }
    return undefined
}

export async function createQuotesTable(knex: Knex) {
    try {
        const tableExist = await knex.schema.hasTable(tableName)

        if (!tableExist) {
            await knex.schema.createTable(
                tableName,
                (table: Knex.CreateTableBuilder) => {
                    table.bigIncrements("id").unsigned().primary()
                    table.text("quote").notNullable()
                    table.string("author", 512).notNullable()
                    table.string("category", 512).notNullable()
                    table.boolean("processed").defaultTo(false)
                    table.string("bgPath")
                    table.string("generatedName")
                    table.string("generatedPath")
                    table.boolean("uploaded")
                    table.boolean("uploadedUrl")
                }
            )

            console.log("quotes table created")
        }
    } catch (err) {
        console.error(err)
    }
}
