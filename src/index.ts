import fs from "fs"
import path from "path"
import sharp from "sharp"

import quotes from "./quotes.json"

const bgFolder = path.resolve(__dirname, "../assets/img/background")
const quoteFolder = path.resolve(__dirname, "../assets/img/quote")
const w = 700
const h = 700

;(async () => {
    const bg = getRandomBackground()
    const quote = getRandomQuote()

    await createQuote(bg, quote.text, w, h)
})().catch((err: any) => {
    console.error(err)
})

async function createQuote(bg: string, quote: string, w: number, h: number) {
    const svg = getSvg(quote, w, h)
    const background = path.normalize(`${bgFolder}\\${bg}`)

    await sharp(background)
        .resize(w, h, {
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
    const tx = (width / 2).toString()
    const ty = (height / 2).toString()
    const spacing = 3
    // const quote = wrapText(text, 30)

    const texts = text.split(" ")

    const svg = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" text-anchor="middle">

            <style type="text/css">
                svg {
                    font-family: serif;
                    fill: white;
                }
                text {
                    font-size: 30;
                }
                rect {
                    fill: black;
                    opacity: 0.4;
                }
            </style>

            <rect width="100%" height="100%"></rect>

            <text>
                <tspan x="50%" y="30%" dy="1em">Yesterday is history,</tspan>
                <tspan x="50%" y="40%" dy="1em">tomorrow is a mystery,</tspan>
                <tspan x="50%" y="50%" dy="1em">today is a gift of God,</tspan>
                <tspan x="50%" y="60%" dy="1em">which is why we call it the present.</tspan>
            </text>

        </svg>
    `

    return svg
}

function getFontSize(text: string) {
    let fontSize = 45
    const resizeHeuristic = 0.9
    const resizeActual = 0.985
    let l = text.length
    while (l > 1) {
        l = l * resizeHeuristic
        fontSize = fontSize * resizeActual

        return fontSize.toFixed(1)
    }
}
