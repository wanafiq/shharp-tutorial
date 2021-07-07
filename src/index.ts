import { runSqliteMigration } from "./db/knex"
import { importQuotes } from "./services/dataService"
import { generateQuotes } from "./services/quoteService"
;(async () => {
    console.time("Total process")

    await runSqliteMigration()

    console.time("Importing quotes")
    console.log("Importing quotes")
    await importQuotes()
    console.timeEnd("Importing quotes")

    console.time("Generating quotes")
    console.log("Generating quotes")
    await generateQuotes()
    console.timeEnd("Generating quotes")

    console.timeEnd("Total process")
    process.exit(0)
})().catch((err: any) => {
    throw new Error(err)
})
