export default async (timeout: number): Promise<void> => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}
