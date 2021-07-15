import fs from "fs"
import path from "path"
import { Knex } from "knex"
import sharp from "sharp"
import { nanoid } from "nanoid"

import config from "../config"
import { Quote, getAll, update } from "../db/quotes"

const assetsDir = path.join(config.paths.root, "assets")

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

export async function generateQuotes(knex: Knex, outputPath: string) {
    const quotes: Quote[] = await getAll(knex)
    if (quotes.length === 0) {
        console.log("Quotes table is empty")
        return
    }

    const logoPath = path.join(assetsDir, logoName)
    const logoBuffer = await getLogo(logoWidth, logoHeight, logoPath)
    const svgStyles = getSvgStyles()

    for (const quoteObject of quotes) {
        const { category, processed } = quoteObject

        if (processed) {
            continue
        }

        const categoryPath = path.join(config.paths.background, category)
        const files = fs.readdirSync(categoryPath)
        if (!files || files.length === 0) {
            return
        }

        const randomIndex = Math.floor(Math.random() * files.length)
        const bgFilename = files[randomIndex]
        const bgFilePath = path.join(
            config.paths.background,
            category,
            bgFilename
        )
        const svgBuffer = getSvg(quoteObject, svgStyles)
        const filename = `${nanoid(10)}.jpeg`

        const generated = await createQuote(
            bgFilePath,
            logoBuffer,
            svgBuffer,
            path.join(outputPath, filename)
        )

        if (generated) {
            quoteObject.processed = true
            quoteObject.bgPath = path.normalize(`${category}/${bgFilename}`)
            quoteObject.generatedName = filename
            const normalize = path.normalize(
                "C:/Users/xenom/Desktop/daily-quotes-assets/output/"
            )
            quoteObject.generatedPath = `${outputPath.replace(
                normalize,
                ""
            )}\\${filename}`
            await update(knex, quoteObject.id, quoteObject)
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
    bgFilePath: string,
    logoBuffger: Buffer,
    svgBuffer: Buffer,
    outputPath: string
) {
    try {
        await sharp(bgFilePath)
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
        console.error(`Failed to generate quote. ${err}`)
        return false
    }
}
