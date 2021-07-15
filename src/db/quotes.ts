import { Knex } from "knex"
export interface Quote {
    id: number
    quote: string
    author: string
    category: string
    processed: boolean
    filename: string
    uploaded: boolean
    uploadedUrl: string
}

export const tableName = "quotes"

export function create(knex: Knex, quote: Quote) {
    return knex(tableName).insert(quote)
}

export function getAll(knex: Knex) {
    return knex(tableName).select("*")
}

export function get(knex: Knex, id: number) {
    return knex(tableName).where("id", id).select()
}

export function update(knex: Knex, id: number, quote: Quote) {
    return knex(tableName).where("id", id).update(quote)
}

export function remove(knex: Knex, id: number) {
    return knex(tableName).where("id", id).del()
}

export function truncate(knex: Knex) {
    return knex(tableName).truncate()
}
