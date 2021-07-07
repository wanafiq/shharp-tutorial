import fs from "fs"
import path from "path"
import sharp from "sharp"

import config from "../config"
import { Quote, getAll, update } from "../db/quotes"

const outputDir = path.join(path.resolve(), "output")
const assetsDir = config.dirs.assets
const bgDir = path.join(assetsDir, "backgrounds")

const defaultWidth = 800
const defaualtHeight = 800
const maxQuoteLength = 150

interface TextPosition {
    text: string
    position: number
}

export async function generateQuotes() {
    const quotes: Quote[] = await getAll()
    if (quotes.length === 0) {
        console.log("Quotes table is empty")
        return
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir)
    }

    for (const q of quotes) {
        const { quote, category, processed } = q

        if (processed) {
            continue
        }

        if (quote.length > maxQuoteLength) {
            continue
        }

        const categoryDir = path.join(bgDir, category)
        const files = fs.readdirSync(categoryDir)
        if (!files || files.length === 0) {
            continue
        }

        const randomIndex = Math.floor(Math.random() * files.length)
        const bgPath = path.join(bgDir, category, files[randomIndex])

        const generated = await createQuote(bgPath, q, q.id.toString())
        if (generated) {
            q.processed = true
            await update(q.id, q)
        }
    }
}

async function createQuote(
    bgPath: string,
    quote: Quote,
    filename: string,
    width?: number,
    height?: number
) {
    try {
        if (!width) width = defaultWidth
        if (!height) height = defaualtHeight

        const svg = getSvg(quote, width, height)

        await sharp(bgPath)
            .resize(width, height, {
                fit: "contain",
            })
            .composite([
                {
                    input: Buffer.from(svg),
                    gravity: "center",
                },
            ])
            .jpeg()
            .toFile(path.join(outputDir, `${filename}.jpg`))
        return true
    } catch (err) {
        return false
    }
}

function getSvg(quote: Quote, width: number, height: number) {
    const w = width.toString()
    const h = height.toString()
    const fontSize = 45
    const authorFontSize = 38
    const x = 50

    const sentences = getSentences(quote, 20)
    const textPositioning = getPositioning(sentences)

    const styles = getSvgStyle(fontSize, authorFontSize)

    const texts = textPositioning
        .map((textPosition, i) => {
            const { text, position } = textPosition

            if (i !== textPositioning.length - 1) {
                //return `<text x="${x}%" y="${position}%" dy="1em" text-anchor="middle">${text}</text>`
                return `<tspan x="${x}%" y="${position}%" dy="1em" text-anchor="middle">${text}</tspan>`
            } else {
                //return `<text x="${x}%" y="${position}%" dy="1em" text-anchor="start" class="author">${text}</text>`
                return `<tspan x="${x}%" y="${position}%" dy="1em" text-anchor="middle" class="author">${text}</tspan>`
            }
        })
        .join("")

    const svg = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">

            ${styles}

            <rect width="100%" height="100%"></rect>

            <text>
                ${texts}
            </text>
        </svg>
    `

    return svg
}

function getSvgStyle(quoteFontSize: number, authorFontSize: number) {
    return `
        <style type="text/css">
            svg {
                font-family: Arial;
                fill: white;
                font-weight:"bold";
            }
            text {
                font-size: ${quoteFontSize};
            }
            rect {
                fill: black;
                opacity: 0.4;
            }

            .author {
                font-size: ${authorFontSize - 15};
            }
        </style>
    `
}

function getSentences(quote: Quote, maxWidth?: number): string[] {
    const words = quote.quote.split(" ")
    const sentences: string[] = []
    const width = maxWidth ? maxWidth : 25
    let currentSentence = ""

    words.forEach((word) => {
        // const firstWordChar = word.trim()[0]
        if (
            currentSentence.length > width
            // ||
            // currentSentence.includes(",") ||
            // currentSentence.includes(".")
            // || sentences.length > 0 && (firstWordChar === firstWordChar.toUpperCase())
        ) {
            sentences.push(
                currentSentence.replace(",", "").replace(".", "").trim()
            )
            currentSentence = "".concat(word.trim())
        } else {
            currentSentence = currentSentence.concat(" ").concat(word.trim())
        }
    })
    currentSentence === "" ? false : sentences.push(currentSentence)
    sentences.push(quote.author)
    return sentences
}

function getPositioning(texts: string[], lineGap?: number): TextPosition[] {
    const textPositions: TextPosition[] = []
    const middleGround = texts.length / 2
    const middleIndex = Math.ceil(middleGround)
    const gap = lineGap ? lineGap : 10

    texts.forEach((text, index) => {
        const distanceFromMiddleIndex = middleIndex - index - 1
        let position = 0
        if (distanceFromMiddleIndex > 0) {
            position = 50 - gap * distanceFromMiddleIndex
        } else if (distanceFromMiddleIndex === 0) {
            position = 50
        } else {
            position = 50 + gap * -distanceFromMiddleIndex
        }
        if (Number.isInteger(middleGround)) {
            position = position - gap / 2
        }
        textPositions.push({ text, position })
    })

    return textPositions
}
