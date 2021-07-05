import fs from "fs"
import path from "path"
import sharp from "sharp"

import quotes from "./quotes.json"

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
    const words = text.split(" ")

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
                ${createSpans(words)}
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

function createSpans(words: string[], width?: number) {
    const w = width ? width : 30
    const x = 50
    let y = 40
    const dy = 1

    let newText = ""
    let newSentence = ""
    let delimeter
    words.forEach((word) => {
        delimeter = newSentence !== "" ? " " : ""

        newSentence = `${newSentence}${delimeter}${word}`
        if (newSentence.length > w) {
            newText += getSpan(x, y, dy, newSentence)
            newSentence = ""
            y += 10
        }
    })
    newText += getSpan(x, y, dy, newSentence)

    return newText
}

function getSpan(x: number, y: number, dy: number, text: string) {
    return `<tspan x="${x.toString()}%" y="${y.toString()}%" dy="${dy.toString()}em">${text}</tspan>`
}
