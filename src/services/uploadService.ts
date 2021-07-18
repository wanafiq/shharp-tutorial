import { Knex } from "knex"
import fetch, { Headers } from "node-fetch"
import fs, { createReadStream } from "fs"
import Mime from "mime"
import path from "path"

import { Quote, getAll } from "../db/quotes"
import QuoteModel from "../models/Quote"
import { update } from "../db/quotes"
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

    for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i]

        if (quote.uploaded) {
            continue
        }

        if (quote.generatedName && quote.generatedPath) {
            const url = await upload(quote.generatedName, quote.generatedPath)
            if (url) {
                const doc = await QuoteModel.create({
                    url,
                    quote: quote.quote,
                    author: quote.author,
                    category: quote.category,
                    bgPath: getBgRelativePath(quote.bgPath, quote.category),
                    generatedPath: getGeneratedQuoteRelativePath(
                        quote.generatedPath
                    ),
                    createdAt: new Date(),
                })

                if (doc) {
                    quote.uploaded = true
                    quote.uploadedUrl = doc.url
                    await update(knex, quote.id, quote)
                }
            }
        }
    }
}

async function upload(filename: string, filePath: string) {
    let sent = false

    const stats = fs.statSync(filePath)
    const size = stats["size"].toString()
    const type = Mime.getType(filename)
    const stream = createReadStream(filePath)

    while (!sent) {
        try {
            const response = await fetch(
                `${baseUrl}/_matrix/media/r0/upload?filename=${filename}`,
                {
                    method: "POST",
                    headers: new Headers({
                        "Content-Length": size,
                        "Content-Type": type ? type : "image/jpeg",
                        Authorization: `Bearer ${accessToken}`,
                    }),
                    body: stream,
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

function getBgRelativePath(bgFilePath: string | undefined, category: string) {
    const bgFolder = "background"

    if (!bgFilePath) return ""

    const filename = path.basename(bgFilePath)

    return `${bgFolder}/${category}/${filename}`
}

function getGeneratedQuoteRelativePath(generatedPath: string | undefined) {
    if (!generatedPath) return ""

    const parsed = path.parse(generatedPath)
    const split = parsed.dir.split("\\")
    const filename = parsed.base

    return `${split[6]}/${split[7]}/${filename}`
}
