import { generateQuotes } from "./services/quoteService"
;(async () => {
    await generateQuotes()
})().catch((err: any) => {
    console.error(err)
})
