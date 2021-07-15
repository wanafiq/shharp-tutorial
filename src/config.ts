import path from "path"

if (!process.env.EXCEL_FOLDER_PATH) {
    throw new Error("Missing EXCEL_FOLDER_PATH")
}
if (!process.env.BACKGROUND_FOLDER_PATH) {
    throw new Error("Missing BACKGROUND_FOLDER_PATH")
}
if (!process.env.OUTPUT_FOLDER_PATH) {
    throw new Error("Missing OUTPUT_FOLDER_PATH")
}
if (!process.env.GENERATED_QUOTE_PATH) {
    throw new Error("Missing GENERATED_QUOTE_PATH")
}
if (!process.env.SQLITE_DB_PATH) {
    throw new Error("Missing SQLITE_DB_PATH")
}
if (!process.env.SQLITE_MIGRATION_PATH) {
    throw new Error("Missing SQLITE_MIGRATION_PATH")
}

const excel = process.env.EXCEL_FOLDER_PATH
const background = process.env.BACKGROUND_FOLDER_PATH
const output = process.env.OUTPUT_FOLDER_PATH
const generatedQuote = process.env.GENERATED_QUOTE_PATH
const migration = process.env.SQLITE_MIGRATION_PATH

const config = {
    paths: {
        root: path.resolve(),
        excel,
        background,
        output,
        generatedQuote,
        migration,
    },
}

export default config
