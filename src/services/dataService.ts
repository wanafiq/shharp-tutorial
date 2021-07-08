import path from "path"
import xlsx from "xlsx"

import config from "../config"
import { Quote, create, truncate } from "../db/quotes"

const excelFilname = "test_quotes.xlsx"
const dataDir = config.dirs.data
const excelFile = path.join(dataDir, excelFilname)
const excelSheetName = "Quotes Database"
const maxQuoteLength = 120

export async function importQuotes() {
    const quotes = readExcel()

    await truncate()

    quotes.forEach(async (quote) => {
        await create(quote)
    })
}

function readExcel() {
    let quotes: Quote[] = []

    try {
        const workbook = xlsx.readFile(excelFile)
        const sheet = workbook.Sheets[excelSheetName]
        const rows = xlsx.utils.sheet_to_json(sheet)

        if (rows) {
            for (const row of rows) {
                const data = row as any

                data.quote = data.quote.trim()
                data.author = data.author.trim()
                data.category = data.category.trim()
                data.processed = false

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
