import mongoose, { Document, Schema } from "mongoose"

export interface IQuote extends Document {
    url: string
    quote: string
    category: string
    author: string
    bgPath: string
    generatedPath: string
    createdAt: Date
}

const QuoteScema: Schema = new Schema(
    {
        url: { type: String, required: true },
        quote: { type: String, required: true },
        category: { type: String, required: true },
        author: { type: String, required: true },
        bgPath: { type: String, required: true },
        generatedPath: { type: String, required: true },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model<IQuote>("Quote", QuoteScema)
