const dotenv = require('dotenv');
dotenv.config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let db;

const initDb = async () => {
  if (db) return db; // Already initialized

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  const client = await MongoClient.connect(uri);
  db = client.db(dbName);
  console.log('✅ MongoDB connected');
  return db;
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
};

const checkConnection = async () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  const admin = db.admin();
  await admin.ping();
  console.log('✅ MongoDB ping successful');
};

module.exports = {
  initDb,
  getDatabase,
  checkConnection,
};
