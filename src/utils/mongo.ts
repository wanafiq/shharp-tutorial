import { mongoose } from "@typegoose/typegoose"

const url =
    "mongodb+srv://wan:GvkgdTcDqjicE9qP@worqapp-dev-w6j3k.mongodb.net/worqapp_dev?retryWrites=true&w=majority"

export default async () => {
    console.log("Connecting to mongodb")

    await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

    console.log("Connected")
}
