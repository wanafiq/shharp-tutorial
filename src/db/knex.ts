import { knex, Knex } from "knex"
import path from "path"

import { createFileIfNotExist } from "../services/fileService"

const tableName = "quotes"

export function getKnex(db: any) {
    const opt = {
        client: "sqlite3",
        connection: {
            filename: path.join(db.dir, db.base),
        },
        useNullAsDefault: true,
        migrations: {
            directory: path.join(db.dir, "migrations"),
        },
    }

    return knex(opt)
}

export function createSqliteDbIfNotExist(dbPath: string) {
    return createFileIfNotExist(dbPath)
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
                    table.boolean("filename")
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
