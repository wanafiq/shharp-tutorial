import path from "path"
import xlsx from "xlsx"
import fs from "fs"

import { Quote } from "./quoteService"

const dataFolder = path.resolve(__dirname, "../../assets/data")
const excelFile = path.resolve(dataFolder, "rawQuote.xls")
const quotesFile = path.resolve(dataFolder, "quotes.json")

const workbook = xlsx.readFile(excelFile)
const sheet = workbook.Sheets["Quotes Database"]
const data = xlsx.utils.sheet_to_json(sheet)

let quotes: Quote[]

quotes = (data as [string: any]).map((d) => {
    d.processed = false

    return d
})

if (fs.existsSync(quotesFile)) {
    fs.unlinkSync(quotesFile)
}

fs.writeFileSync(quotesFile, JSON.stringify(data))
