import mongoose, { ConnectOptions } from "mongoose"

const url =
    "mongodb+srv://wan:GvkgdTcDqjicE9qP@worqapp-dev-w6j3k.mongodb.net/worqapp_dev?retryWrites=true&w=majority"

export default () => {
    const opt: ConnectOptions = {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }

    mongoose
        .connect(url, opt)
        .then((res) => {
            console.log("Connected to mongodb")
        })
        .catch((err) => {
            throw new Error(`Failed connect to mongodb. ${err}`)
        })
}
