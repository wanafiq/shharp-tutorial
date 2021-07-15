import fs from "fs"
import Path from "path"

export function folderExist(folderPath: string) {
    return fs.existsSync(folderPath)
}

export function createFolderIfNotExist(folderPath: string) {
    try {
        if (!folderExist(folderPath)) {
            fs.mkdirSync(folderPath)
        }
    } catch (err) {
        return undefined
    }

    return Path.parse(folderPath)
}

export function fileExist(filePath: string) {
    return fs.existsSync(filePath)
}

export function createFileIfNotExist(filePath: string) {
    if (!fileExist(filePath)) {
        fs.writeFile(filePath, "", async (err) => {
            if (err) {
                throw new Error(
                    `Failed to create sqlite at ${filePath}. ${err}`
                )
            }

            console.log(`sqlite db created`)
        })
    }

    return Path.parse(filePath)
}
