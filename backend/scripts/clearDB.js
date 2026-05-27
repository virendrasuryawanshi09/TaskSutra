require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

async function clearDatabase() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected!\n");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  console.log("Collections found:", names.join(", ") || "(none)");
  console.log("\nDeleting all documents from every collection...\n");

  for (const name of names) {
    const result = await db.collection(name).deleteMany({});
    console.log(`  ✓ ${name}: deleted ${result.deletedCount} document(s)`);
  }

  console.log("\n✅ Database wiped successfully. Fresh start!");
  await mongoose.disconnect();
  process.exit(0);
}

clearDatabase().catch((err) => {
  console.error("Error wiping database:", err.message);
  process.exit(1);
});
