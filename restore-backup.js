const fs = require("fs");
const { MongoClient } = require("mongodb");
const { EJSON } = require("bson");

// ==================================================
// SETTINGS
// ==================================================

const MONGO_URI = "mongodb://localhost:27017";
const DATABASE_NAME = "billing-backup-test";

// Apni backup file ka exact naam yahan daalo
const BACKUP_FILE = "{backup_file_name}.json"; // Example: "backup.json"

// ==================================================
// RESTORE
// ==================================================

async function restoreBackup() {
  let client;

  try {
    console.log("Reading backup file...");

    if (!fs.existsSync(BACKUP_FILE)) {
      throw new Error(
        `Backup file not found: ${BACKUP_FILE}`
      );
    }

    const jsonBackup = fs.readFileSync(
      BACKUP_FILE,
      "utf8"
    );

    // EJSON converts MongoDB ObjectIds and Dates correctly
    const backup = EJSON.parse(jsonBackup);

    if (
      !backup ||
      !backup.collections
    ) {
      throw new Error(
        "Invalid backup file. 'collections' not found."
      );
    }

    console.log("Connecting to MongoDB...");

    client = new MongoClient(MONGO_URI);

    await client.connect();

    const db = client.db(DATABASE_NAME);

    console.log(
      `Connected to database: ${DATABASE_NAME}`
    );

    const collections =
      Object.entries(backup.collections);

    console.log(
      `Found ${collections.length} collections.`
    );

    // ==================================================
    // RESTORE EACH COLLECTION
    // ==================================================

    for (const [
      collectionName,
      documents,
    ] of collections) {
      if (!Array.isArray(documents)) {
        console.log(
          `Skipping ${collectionName} - invalid data`
        );

        continue;
      }

      console.log(
        `Restoring ${collectionName}...`
      );

      // Delete existing collection if present
      const exists =
        await db
          .listCollections({
            name: collectionName,
          })
          .hasNext();

      if (exists) {
        await db
          .collection(collectionName)
          .drop();

        console.log(
          `  Existing collection cleared.`
        );
      }

      // Create collection
      await db.createCollection(
        collectionName
      );

      // Insert documents
      if (documents.length > 0) {
        await db
          .collection(collectionName)
          .insertMany(documents);

        console.log(
          `  ${documents.length} documents restored.`
        );
      } else {
        console.log(
          `  Collection is empty.`
        );
      }
    }

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "BACKUP RESTORED SUCCESSFULLY"
    );
    console.log(
      "========================================"
    );
    console.log(
      `Database: ${DATABASE_NAME}`
    );
  } catch (error) {
    console.error("");
    console.error(
      "RESTORE FAILED:"
    );
    console.error(error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

restoreBackup();