import fs from "fs"
import path from "path"
import sharp from "sharp"

import config from "../config"
import { Quote, getAll, update } from "../db/quotes"

const outputDir = path.join(path.resolve(), "output")
const assetsDir = config.dirs.assets
const bgDir = path.join(assetsDir, "backgrounds")

// Black Overlay behind texts
const overlayWidthPercent = 100
const overlayHeightPercent = 100
const overlayColor = "black"
const overlayOpacity = 0.4

// Quote
const width = 800
const height = 800
const xPositionPercent = 50
const fontFamily = "Arial"
const fontColor = "white"
const fontWeight = "bold"
const textSize = 45
const authorTextSize = 25
const textAnchor = "middle"
const textMaxChars = 20 // max chars count util text is appended to new line

// Logo
const logoName = "logo_white.png"
const logoWidth = 200
const logoHeight = 61
const logoPadding = 20

export async function generateQuotes() {
    const quotes: Quote[] = await getAll()
    if (quotes.length === 0) {
        console.log("Quotes table is empty")
        return
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir)
    }

    const logoPath = path.join(assetsDir, logoName)
    const logoBuffer = await getLogo(logoWidth, logoHeight, logoPath)

    const svgStyles = getSvgStyles()

    for (const quoteObject of quotes) {
        const { category, processed } = quoteObject

        if (processed) {
            continue
        }

        const categoryDir = path.join(bgDir, category)
        const files = fs.readdirSync(categoryDir)
        if (!files || files.length === 0) {
            continue
        }

        const randomIndex = Math.floor(Math.random() * files.length)
        const bgPath = path.join(bgDir, category, files[randomIndex])
        const svgBuffer = getSvg(quoteObject, svgStyles)
        const filename = `${quoteObject.id.toString()}.jpg`
        const outputPath = path.join(outputDir, filename)

        const generated = await createQuote(
            bgPath,
            logoBuffer,
            svgBuffer,
            outputPath
        )

        if (generated) {
            quoteObject.processed = true
            await update(quoteObject.id, quoteObject)
        }
    }
}

async function getLogo(width: number, height: number, path: string) {
    try {
        const logoBuffer = await sharp(path)
            .resize(width, height)
            .png()
            .toBuffer()

        return logoBuffer
    } catch (err) {
        throw new Error(`Failed to get logo. ${err}`)
    }
}

function getSvgStyles() {
    return `
        <style type="text/css">
            svg {
                font-family: ${fontFamily};
                fill: ${fontColor};
                font-weight:"${fontWeight}";
            }
            text {
                font-size: ${textSize};
            }
            rect {
                fill: ${overlayColor};
                opacity: ${overlayOpacity};
            }

            .author {
                font-size: ${authorTextSize};
            }
        </style>
    `
}

function getSvg(quoteObject: Quote, styles: string) {
    const sentences = splitToMultilines(quoteObject.quote, quoteObject.author)
    const textPositions = getDynamicYPositions(sentences)
    const lastTextPosition = textPositions.length - 1

    const texts = textPositions
        .map((textPosition, i) => {
            const { text, position } = textPosition

            if (i !== lastTextPosition) {
                return `<tspan x="${xPositionPercent}%" y="${position}%" dy="1em" text-anchor="${textAnchor}">${text}</tspan>`
            } else {
                const authorPosition = position - 0.5

                return `<tspan x="${xPositionPercent}%" y="${authorPosition}%" dy="1em" text-anchor="${textAnchor}" class="author">${text}</tspan>`
            }
        })
        .join("")

    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">

            ${styles}

            <rect width="${overlayWidthPercent}%" height="${overlayHeightPercent}%"></rect>

            <text>
                ${texts}
            </text>
        </svg>
    `

    return Buffer.from(svg)
}

function splitToMultilines(quote: string, author: string): string[] {
    const words = quote.split(" ")
    const sentences: string[] = []

    let currentSentence = ""

    words.forEach((word) => {
        if (currentSentence.length > textMaxChars) {
            sentences.push(currentSentence)
            currentSentence = "".concat(word.trim())
        } else {
            currentSentence = currentSentence.concat(" ").concat(word.trim())
        }
    })
    currentSentence === "" ? false : sentences.push(currentSentence)
    sentences.push(author)
    return sentences
}

function getDynamicYPositions(texts: string[], lineGap?: number) {
    interface YPosition {
        text: string
        position: number
    }

    const textPositions: YPosition[] = []
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

async function createQuote(
    bgPath: string,
    logoBuffger: Buffer,
    svgBuffer: Buffer,
    outputPath: string
) {
    try {
        await sharp(bgPath)
            .resize(width, height, {
                fit: "contain",
            })
            .composite([
                {
                    input: svgBuffer,
                    blend: "atop",
                    gravity: "center",
                },
                {
                    input: logoBuffger,
                    blend: "atop",
                    top: height - logoHeight - logoPadding,
                    left: (width - logoWidth) / 2,
                },
            ])
            .jpeg()
            .toFile(outputPath)
        return true
    } catch (err) {
        return false
    }
}
