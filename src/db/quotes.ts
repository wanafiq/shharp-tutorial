import knex from "./knex"

export interface Quote {
    id: number
    quote: string
    author: string
    category: string
    processed: boolean
}

export const tableName = "quotes"

export function create(quote: Quote) {
    return knex(tableName).insert(quote)
}

export function getAll() {
    return knex(tableName).select("*")
}

export function get(id: number) {
    return knex(tableName).where("id", id).select()
}

export async function update(id: number, quote: Quote) {
    // return knex(tableName).where("id", id).update(quote)

    try {
        const trx = await knex.transaction()
        try {
            knex(tableName).transacting(trx).where("id", id).update(quote)
            trx.commit()
        } catch (err) {
            trx.rollback()
        }
    } catch (err) {}
}

export function remove(id: number) {
    return knex(tableName).where("id", id).del()
}

export function truncate() {
    return knex(tableName).truncate()
}
