import path from "path"
import xlsx from "xlsx"

import config from "../config"
import { Quote, create, truncate } from "../db/quotes"

const assetsDir = config.dirs.assets
const excelFile = path.join(assetsDir, "data", "test_quotes.xlsx")
const excelSheetName = "Quotes Database"

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
        const data = xlsx.utils.sheet_to_json(sheet)

        if (data) {
            quotes = (data as [string: any]).map((d) => {
                d.quote = d.quote
                    .trim()
                    .replace(";", ",")
                    .replace(":", ",")
                    .replace("..", ".")
                d.author = d.author.trim()
                d.category = d.category.trim()
                d.processed = false
                return d
            })
        }
    } catch (err) {
        throw new Error(`Failed to read excel file. ${err}`)
    }

    return quotes
}
