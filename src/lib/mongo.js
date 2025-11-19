const { MongoClient, ObjectId } = require('mongodb');
const config = require('../config');

let mongoClient;
let database;
let collections;

async function connectToDatabase() {
  if (database && collections) {
    return { client: mongoClient, db: database, collections };
  }

  mongoClient = new MongoClient(config.mongoUri);
  await mongoClient.connect();
  database = mongoClient.db(config.dbName);
  collections = {
    classes: database.collection('classes'),
    orders: database.collection('orders'),
  };

  await collections.classes.createIndex({
    subject: 'text',
    location: 'text',
    description: 'text',
  });

  return { client: mongoClient, db: database, collections };
}

function getCollections() {
  if (!collections) {
    throw new Error('Database has not been initialized yet. Call connectToDatabase first.');
  }
  return collections;
}

async function closeConnection() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = undefined;
    database = undefined;
    collections = undefined;
  }
}

module.exports = {
  connectToDatabase,
  getCollections,
  closeConnection,
  ObjectId,
};
