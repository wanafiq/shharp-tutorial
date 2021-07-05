import fs from "fs"
import path from "path"
import sharp from "sharp"

import quotes from "./quotes.json"

interface TextPosition {
    text: string
    position: number
}

const bgFolder = path.resolve(__dirname, "../assets/img/background")
const quoteFolder = path.resolve(__dirname, "../assets/img/quote")
const maxWidth = 700
const maxHeigt = 700
const defaultFontSize = 38

;(async () => {
    const bg = getRandomBackground()
    const quote = getRandomQuote()

    await createQuote(bg, quote.text, maxWidth, maxHeigt)
})().catch((err: any) => {
    console.error(err)
})

async function createQuote(
    bg: string,
    quote: string,
    width: number,
    height: number
) {
    const svg = getSvg(quote, width, height)
    const background = path.normalize(`${bgFolder}\\${bg}`)

    await sharp(background)
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
        .toFile(path.normalize(`${quoteFolder}\\quote1.jpg`))
}

function getRandomBackground() {
    const files = fs.readdirSync(bgFolder)

    if (!files) {
        console.error(`Failed to load files from ${bgFolder}`)
    }

    const randomIndex = Math.floor(Math.random() * files.length)
    const bg = files[randomIndex]

    return bg
}

function getRandomQuote() {
    if (!quotes) {
        console.error(`Failed to load quotes`)
    }

    const randomIndex = Math.floor(Math.random() * quotes.length)
    const quote = quotes[randomIndex]

    return quote
}

function getSvg(text: string, width: number, height: number) {
    const w = width.toString()
    const h = height.toString()

    const fontSize = getFontSize(text)
    const sentences = getSentences(text.split(" "))
    const textPositioning = getPositioning(sentences)

    const svg = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" text-anchor="middle">

            <style type="text/css">
                svg {
                    font-family: serif;
                    fill: white;
                }
                text {
                    font-size: ${fontSize};
                }
                rect {
                    fill: black;
                    opacity: 0.4;
                }
            </style>

            <rect width="100%" height="100%"></rect>

            <text>
            ${
                textPositioning.map(textPosition => {
                    const {text, position} = textPosition
                    return `<tspan x="50%" y="${position}%" dy="1em">${text}</tspan>`
                })
            }
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

    words.forEach(word => {
        // const firstWordChar = word.trim()[0]
        if(currentSentence.length > width 
            || currentSentence.includes(",") 
            || currentSentence.includes(".")
            // || sentences.length > 0 && (firstWordChar === firstWordChar.toUpperCase())
        ) {
            sentences.push(currentSentence.replace(",", "").replace(".", "").trim())
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
        const distanceFromMiddleIndex = (middleIndex - index) - 1
        let position = 0
        if(distanceFromMiddleIndex > 0) {
            position = 50 - (gap*(distanceFromMiddleIndex))
        } else if(distanceFromMiddleIndex === 0) {
            position = 50
        } else {
            position = 50 + (gap*-(distanceFromMiddleIndex))
        }
        if(Number.isInteger(middleGround)) {
            position = position - gap / 2
        }
        textPositions.push({text, position})
    })

    return textPositions
}
