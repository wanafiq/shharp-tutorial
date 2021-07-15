import { Knex } from "knex"
import fetch, { Headers } from "node-fetch"

import { Quote, getAll } from "../db/quotes"
import { DailyQuote, DailyQuoteModel } from "../models/DailyQuote"
import delay from "../utils/delay"

const baseUrl = "https://dev-synapse.api.worqapp.com"
const accessToken =
    "3975d3d60e0a1fd43cf711748689f804ae2e9e75d7a0d9853084301647969ec9"

export async function uploadQuotes(knex: Knex) {
    const quotes: Quote[] = await getAll(knex)
    if (quotes.length === 0) {
        console.log("Quotes table is empty")
        return
    }

    const quote: Omit<DailyQuote, "_id" | "__v" | "__t"> = {
        url: "mxc://example.com/AQwafuaFswefuhsfAFAgsw",
        quote: "Do not wait for extraordinary circumstances to do good action; try to use ordinary situations.",
        author: "Richter, Jean Paul",
        category: "action",
        bgPath: "/background/action/6CJax9RrU7.jpeg",
        generatedPath: "/generated/j6soqjuODD.jpeg",
        createdAt: new Date(),
    }

    const saved = await DailyQuoteModel.create(quote)
    console.log("saved ", saved)

    quotes.map(async (quote) => {
        // const url = await upload(quote.filename)
        // if (url) {
        //     // update database
        // }
    })
}

async function upload(filename: string) {
    let sent = false

    while (!sent) {
        try {
            const response = await fetch(
                `${baseUrl}/_matrix/media/r0/upload?filename=${filename}`,
                {
                    method: "POST",
                    headers: new Headers({
                        "Content-Type": "image/jpeg",
                        Authorization: `Bearer ${accessToken}`,
                    }),
                }
            )

            if (response.status === 200) {
                const data = await response.json()

                sent = true
                return data.content_uri
            }
        } catch (err) {
            if (err.errcode === "M_LIMIT_EXCEEDED") {
                let delay_ms = 2000

                if (err.data && typeof err.data.retry_after_ms === "number") {
                    delay_ms = err.data.retry_after_ms
                }

                delay_ms += 1000

                console.error(
                    `Limit exeeded. Retrying after ${delay_ms / 1000}s`
                )

                await delay(delay_ms)
            } else {
                console.error(`Failed to upload image ${err.message}`)
                sent = true
                return undefined
            }
        }
    }
}
