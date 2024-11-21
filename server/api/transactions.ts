import { MongoClient, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)
const dbName = 'test'

export default defineEventHandler(async (event) => {
    try {
        await client.connect()
        const db = client.db(dbName)
        const collection = db.collection('transactions')

        const transactions = await collection.find({}).limit(50).sort({ blockTime: -1 }).toArray()
        return transactions

    } catch (error) {
        console.error('Error:', error)
        throw createError({
            statusCode: 500,
            message: 'Server error occurred'
        })
    }
})
