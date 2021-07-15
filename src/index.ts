import path from "path"
import dotenv from "dotenv"
import { Knex } from "knex"

dotenv.config()

import config from "./config"
import {
    getFolder,
    createFolder,
    getFile,
    createFile,
} from "./services/fileService"
import { getKnex, createQuotesTable } from "./db/knex"
import { importQuotes } from "./services/dataService"
import { generateQuotes } from "./services/quoteService"
import { uploadQuotes } from "./services/uploadService"
import connectToMongo from "./utils/mongo"

// yarn dev generate-quotes 'quotes_reviewed 1.xlsx'
// yarn dev upload-quotes 'quotes_reviewed 1.xlsx'
enum ProcessType {
    GenerateQuotes = "generate-quotes",
    UploadQuotes = "upload-quotes",
}

;(async () => {
    const command = process.argv[2]
    const filename = process.argv[3]
    if (!filename) {
        throw new Error("Please input file name to be processed")
    }

    const outputPath = getFolder(config.paths.output)
    if (outputPath.length === 0) {
        createFolder(config.paths.output)
    }

    let currentBatchPath = getFolder(path.join(config.paths.output, filename))
    if (currentBatchPath.length === 0) {
        currentBatchPath = createFolder(
            path.join(config.paths.output, filename)
        )
    }

    const dbPath = path.join(
        path.join(config.paths.output, filename),
        "db.sqlite3"
    )
    if (getFile(dbPath).length === 0) {
        createFile(dbPath)
    }

    const knex = getKnex(dbPath)
    if (!knex) {
        throw new Error(`Failed to get knex instance`)
    }

    if (command === ProcessType.GenerateQuotes) {
        await createQuotesTable(knex)

        let outputPath = path.join(currentBatchPath, "generated")
        if (getFolder(outputPath).length === 0) {
            outputPath = createFolder(outputPath)
        }
        console.time("Importing quotes")
        console.log("Importing quotes")
        await importQuotes(knex, filename)
        console.timeEnd("Importing quotes")

        console.time("Generating quotes")
        console.log("Generating quotes")
        await generateQuotes(knex, outputPath)
        console.timeEnd("Generating quotes")
    } else if (command === ProcessType.UploadQuotes) {
        connectToMongo()

        console.time("Uploading quotes")
        console.log("Uploading quotes")
        await uploadQuotes(knex)
        console.timeEnd("Uploading quotes")
    } else {
        throw new Error(
            `Unkown command ${command}. Please state process type. Run 'yarn dev generate-quotes' or 'yarn dev upload-quote'`
        )
    }

    process.exit(0)
})().catch((err: any) => {
    throw new Error(err)
})
