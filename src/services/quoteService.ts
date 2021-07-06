import fs from "fs"
import path from "path"
import sharp from "sharp"

// @ts-ignore
import quotes from "../../assets/data/quotes.json"

export interface Quote {
    quote: string
    author: string
    category: string
    processed: boolean
}

interface TextPosition {
    text: string
    position: number
}

const assetsFolder = path.resolve(__dirname, "../../assets")
const outputFolder = path.resolve(__dirname, "../../output")
const bgFolder = path.resolve(assetsFolder, "backgrounds")
const maxWidth = 700
const maxHeigt = 700
const defaultFontSize = 45

export async function generateQuotes() {
    for (let i = 0; i < quotes.length; i++) {
        const q = quotes[i]
        const { quote, category, processed } = q

        if (processed) {
            continue
        }

        if (quote.length > 100) {
            continue
        }

        const bg = getRandomBackground(category)
        const bgPath = path.normalize(`${bgFolder}\\${q.category}\\${bg}`)
        await createQuote(bgPath, q, maxWidth, maxHeigt, `quote${i}`)

        updateJsonFile(i)
    }
}

async function createQuote(
    bgPath: string,
    quote: Quote,
    width: number,
    height: number,
    outputFilename: string
) {
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
        .toFile(path.normalize(`${outputFolder}\\${outputFilename}.jpg`))
}

function getRandomBackground(category: string) {
    const categoryFolder = path.resolve(bgFolder, category)

    try {
        const files = fs.readdirSync(categoryFolder, "utf-8")
        if (!files || files.length === 0) {
            return undefined
        }

        const randomIndex = Math.floor(Math.random() * files.length)
        const bg = files[randomIndex]

        return bg
    } catch (err) {
        throw new Error(`Failed to load files from ${bgFolder}. ${err}`)
    }
}

function getRandomQuote() {
    if (!quotes) {
        console.error(`Failed to load quotes`)
    }

    const randomIndex = Math.floor(Math.random() * quotes.length)
    const quote = quotes[randomIndex]

    return quote
}

function getSvg(quote: Quote, width: number, height: number) {
    const w = width.toString()
    const h = height.toString()

    const fontSize = getFontSize(quote.quote)
    const sentences = getSentences(quote.quote.split(" "))
    const textPositioning = getPositioning(sentences)
    const lastPosition =
        textPositioning[textPositioning.length - 1].position + 10

    const svg = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" text-anchor="middle">

            <style type="text/css">
                svg {
                    font-family: Arial;
                    fill: white;
                    font-weight:"bold";
                }
                text {
                    font-size: ${fontSize};
                }
                rect {
                    fill: black;
                    opacity: 0.4;
                }

                .author {
                    font-size: 26;
                    fill: white;
                    font-weight:"bold";
                }
            </style>

            <rect width="100%" height="100%"></rect>

            <text>
            ${textPositioning.map((textPosition) => {
                const { text, position } = textPosition

                text.replace(";", "")

                return `<tspan x="50%" y="${position}%" dy="1em">${text}</tspan>`
            })}
            <tspan x="50%" y="${lastPosition}%" dy="1em" class="author" text-anchor="end">
                ${quote.author}
            </tspan>
            </text>

        </svg>
    `

    return svg
}

function getFontSize(text: string) {
    let fontSize = defaultFontSize
    const resizeHeuristic = 0.9
    const resizeActual = 0.985
    let l = text.length
    while (l > 1) {
        l = l * resizeHeuristic
        fontSize = fontSize * resizeActual

        return fontSize.toFixed(1)
    }
}

function getSentences(words: string[], maxWidth?: number): string[] {
    const sentences: string[] = []
    const width = maxWidth ? maxWidth : 25
    let currentSentence = ""

    words.forEach((word) => {
        // const firstWordChar = word.trim()[0]
        if (
            currentSentence.length > width ||
            currentSentence.includes(",") ||
            currentSentence.includes(".")
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

function updateJsonFile(index: number) {
    const dataFolder = path.resolve(assetsFolder, "data")
    const quotesPath = path.normalize(`${dataFolder}\\quotes.json`)

    const data: Quote = quotes[index]
    data.processed = true
    quotes[index] = data

    fs.writeFileSync(quotesPath, JSON.stringify(quotes))
}
