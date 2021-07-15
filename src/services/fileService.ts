import fs from "fs"
import Path from "path"

export function getFolder(path: string) {
    if (fs.existsSync(path)) {
        return path
    }
    return ""
}

export function createFolder(path: string) {
    try {
        fs.mkdirSync(path)
        return path
    } catch (err) {
        console.error(err)
    }
    return ""
}

export function getFile(path: string) {
    if (fs.existsSync(path)) {
        return path
    }
    return ""
}

export function createFile(path: string) {
    fs.writeFile(path, "", async (_err) => {
        console.log(`sqlite db created`)
        return path
    })
}
