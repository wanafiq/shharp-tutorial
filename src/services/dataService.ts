import path from "path"
import xlsx from "xlsx"
import { Knex } from "knex"

import config from "../config"
import { Quote, create } from "../db/quotes"

const maxQuoteLength = 120

export async function importQuotes(knex: Knex, filename: string) {
    const quotes = readExcel(filename)

    if (quotes.length > 0) {
        console.log("Saving quotes into sqlite db")

        for (const quote of quotes) {
            await create(knex, quote)
        }
    }
}

function readExcel(filename: string) {
    let quotes: Quote[] = []

    try {
        const filePath = path.join(config.paths.excel, `${filename}.xlsx`)
        const workbook = xlsx.readFile(filePath)
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = xlsx.utils.sheet_to_json(sheet)

        if (rows) {
            for (const row of rows) {
                const data = row as any

                data.quote = data.quote.trim()
                data.author = data.author.trim()
                data.category = data.category.trim()

                if (data.quote.length <= maxQuoteLength) {
                    quotes.push(data)
                }
            }
        }
    } catch (err) {
        throw new Error(`Failed to read excel file. ${err}`)
    }

    return quotes
}
