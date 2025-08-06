import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI as string;
const dbName = process.env.DB_NAME as string;

if (!uri || !dbName) {
  throw new Error('Missing MongoDB connection string or DB name in .env');
}

const client = new MongoClient(uri);
let db: Db;

export async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
  }
  return db;
}
