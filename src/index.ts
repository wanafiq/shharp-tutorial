import path from "path"
import { Knex } from "knex"

import config from "./config"
import {
    createFolderIfNotExist,
    folderExist,
    fileExist,
} from "./services/fileService"
import { getKnex, createSqliteDbIfNotExist, createQuotesTable } from "./db/knex"
import { importQuotes } from "./services/dataService"
import { generateQuotes } from "./services/quoteService"
import { uploadQuotes } from "./services/uploadService"
import connectToMongo from "./utils/mongo"

// yarn dev generate-quotes 'C:\Users\xenom\Desktop\daily-quotes-assets\reviewed-quotes\quotes_reviewed 1.xlsx' 'C:\Users\xenom\Desktop\daily-quotes-assets\backgrounds'
// yarn dev upload-quotes 'C:\Users\xenom\Desktop\daily-quotes-assets\reviewed-quotes\quotes_reviewed 1.xlsx'
enum ProcessType {
    GenerateQuotes = "generate-quotes",
    UploadQuotes = "upload-quotes",
}

const outputDir = path.join(config.rootDir, "output")

;(async () => {
    const command = process.argv[2]
    const filePath = process.argv[3]

    if (!filePath) {
        throw new Error("Please input file path to be processed")
    }

    const outputFolder = createFolderIfNotExist(outputDir)
    if (!outputFolder) {
        console.error(`Failed to create folder at path ${outputDir}`)
        process.exit(1)
    }

    if (command === ProcessType.GenerateQuotes) {
        const file = path.parse(filePath)
        const folderPath = path.join(outputDir, file.name)
        const folder = createFolderIfNotExist(folderPath)
        if (!folder) {
            throw new Error(`Failed to create folder at path ${folderPath}`)
        }

        const dbPath = path.join(folder.dir, folder.name, "db.sqlite3")
        const db = createSqliteDbIfNotExist(dbPath)
        if (!db) {
            throw new Error(`Failed to create db at path ${dbPath}`)
        }

        const knex = getKnex(db)
        await createQuotesTable(knex)

        const bgPath = process.argv[4]
        if (!bgPath) {
            throw new Error("Please input bg path")
        }

        await runQuotesService(knex, bgPath, folder, file)
    } else if (command === ProcessType.UploadQuotes) {
        const file = path.parse(filePath)
        const folderPath = path.join(outputDir, file.name)
        if (!folderExist(folderPath)) {
            throw new Error(`Cant find folder at path ${folderPath}`)
        }

        const folder = path.parse(folderPath)
        const dbPath = path.join(folder.dir, folder.name, "db.sqlite3")
        if (!fileExist(dbPath)) {
            throw new Error(`Cant find db at path ${dbPath}`)
        }

        const db = path.parse(dbPath)
        const knex = getKnex(db)
        await runUploadService(knex)
    } else {
        throw new Error(
            `Unkown command ${command}. Please state process type. Run 'yarn dev generate-quotes' or 'yarn dev upload-quote'`
        )
    }

    process.exit(0)
})().catch((err: any) => {
    throw new Error(err)
})

async function runQuotesService(
    knex: Knex,
    bgPath: string,
    folder: any,
    file: any
) {
    console.time("Importing quotes")
    console.log("Importing quotes")

    await importQuotes(knex, file)

    console.timeEnd("Importing quotes")

    console.time("Generating quotes")
    console.log("Generating quotes")

    const generatedPath = path.join(folder.dir, folder.name, "generated")
    const generatedFolder = createFolderIfNotExist(generatedPath)
    if (!generatedFolder) {
        throw new Error(`Failed to create folder at path ${generatedPath}`)
    }

    await generateQuotes(knex, bgPath, generatedPath)

    console.timeEnd("Generating quotes")
}

async function runUploadService(knex: Knex) {
    await connectToMongo()

    console.time("Uploading quotes")
    console.log("Uploading quotes")

    // await uploadQuotes(knex)

    console.timeEnd("Uploading quotes")
}
