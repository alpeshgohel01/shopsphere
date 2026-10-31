/**
 * Ensure MongoDB indexes for auth collections.
 * Usage: npm run db:indexes
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db();

  console.log("Creating indexes");

  // Unique email (application stores lowercased emails)
  await db.collection("user").createIndex(
    { email: 1 },
    { unique: true, name: "user_email_unique" },
  );

  // Sessions: lookup + TTL on expiresAt
  await db.collection("session").createIndex(
    { token: 1 },
    { unique: true, name: "session_token_unique" },
  );
  await db.collection("session").createIndex(
    { userId: 1 },
    { name: "session_userId" },
  );
  await db.collection("session").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "session_expires_ttl" },
  );

  // Accounts
  await db.collection("account").createIndex(
    { userId: 1 },
    { name: "account_userId" },
  );
  await db.collection("account").createIndex(
    { providerId: 1, accountId: 1 },
    { unique: true, name: "account_provider_account_unique" },
  );

  // Verification / reset tokens " TTL
  await db.collection("verification").createIndex(
    { identifier: 1 },
    { name: "verification_identifier" },
  );
  await db.collection("verification").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "verification_expires_ttl" },
  );

  // Rate limits
  await db.collection("rate_limits").createIndex(
    { key: 1 },
    { unique: true, name: "rate_limits_key_unique" },
  );
  await db.collection("rate_limits").createIndex(
    { resetAt: 1 },
    { expireAfterSeconds: 0, name: "rate_limits_reset_ttl" },
  );

  console.log("Indexes ensured successfully.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await client.close();
  });
