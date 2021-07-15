import { Base } from "@typegoose/typegoose/lib/defaultClasses"
import { getModelForClass, prop } from "@typegoose/typegoose"

export class DailyQuote extends Base {
    @prop({ required: true })
    url!: string

    @prop({ default: true })
    quote!: string

    @prop({ required: true })
    category!: string

    @prop({ required: true })
    author!: string

    @prop({ required: true })
    bgPath!: string

    @prop({ required: true })
    generatedPath!: string

    @prop({ required: true })
    createdAt!: Date
}

export const DailyQuoteModel = getModelForClass(DailyQuote)
