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

    const promises = quotes.map(async (q) => {
        const { quote, category, processed } = q

        if (processed) {
            return
        }

        if (quote.length > maxQuoteLength) {
            return
        }

        const categoryDir = path.join(`${bgDir}`, `${category}`)
        const files = fs.readdirSync(categoryDir)
        if (!files || files.length === 0) {
            return
        }

        const randomIndex = Math.floor(Math.random() * files.length)

        const bgPath = path.join(
            `${bgDir}`,
            `${category}`,
            `${files[randomIndex]}`
        )

        q.processed = true

        return Promise.all([
            update(q.id, q),
            createQuote(bgPath, q, q.id.toString()),
        ])
    })

    await Promise.all(promises)
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
    } catch (err) {}
}

function getSvg(quote: Quote, width: number, height: number) {
    const w = width.toString()
    const h = height.toString()
    const fontSize = 45
    const authorFontSize = 38

    const x = getXpos(quote.quote.length)

    const sentences = getSentences(quote, 20)
    const textPositioning = getPositioning(sentences)

    const svg = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">

            ${getSvgStyle(fontSize, authorFontSize)}

            <rect width="100%" height="100%"></rect>

            ${textPositioning.map((textPosition, i) => {
                const { text, position } = textPosition

                if (i !== textPositioning.length - 1) {
                    return `<text x="${x}%" y="${position}%" dy="1em" text-anchor="start">${text}</text>`
                } else {
                    return `<text x="${x}%" y="${position}%" dy="1em" text-anchor="start" class="author">${text}</text>`
                }
            })}

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

function getXpos(textLength: number) {
    let x

    if (textLength <= 50) {
        x = 25
    } else if (textLength >= 100 && textLength <= 120) {
        x = 18
    } else if (textLength >= 130 && textLength <= 140) {
        x = 22
    } else {
        x = 20
    }

    return x
}

function getFontSize(text: string) {
    let fontSize = 45
    const resizeHeuristic = 0.9
    const resizeActual = 0.985
    let l = text.length
    while (l > 1) {
        l = l * resizeHeuristic
        fontSize = fontSize * resizeActual
    }
    return fontSize.toFixed(1)
}
