import "server-only";
import { MongoClient } from "mongodb";

/**
 * Cached MongoDB singleton for Next.js hot reload + serverless.
 * @typedef {{ client: MongoClient, promise: Promise<MongoClient> }} MongoCache
 */

/** @type {{ _mongo?: MongoCache }} */
const globalForMongo = globalThis;

/**
 * @returns {MongoCache}
 */
function getMongoCache() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!globalForMongo._mongo) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
    });
    globalForMongo._mongo = {
      client,
      promise: client.connect(),
    };
  }

  return globalForMongo._mongo;
}

/**
 * Synchronous client handle. Call getMongoClient() before first DB use in cold starts.
 * @returns {MongoClient}
 */
export function getMongoClientSync() {
  return getMongoCache().client;
}

/**
 * @returns {Promise<MongoClient>}
 */
export async function getMongoClient() {
  const cache = getMongoCache();
  await cache.promise;
  return cache.client;
}

/**
 * @param {string} [dbName]
 */
export async function getDb(dbName) {
  const client = await getMongoClient();
  return client.db(dbName);
}

/**
 * Sync Db handle for Better Auth adapter init (ops wait until connected).
 * @param {string} [dbName]
 */
export function getDbSync(dbName) {
  return getMongoClientSync().db(dbName);
}
