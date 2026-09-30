import mongoose from "mongoose";

const MONGODB_URI = "mongodb://127.0.0.1:27017/gj-electronic";

const images: Record<string, string[]> = {
  "havells-1200mm-ceiling-fan": ["/products/sosyo.png", "/products/clock.png"],
  "philips-9w-led-bulb-4pack": ["/products/bike1.png", "/products/bike2.png"],
  "wipro-20w-led-batten": ["/products/metro1.png", "/products/metro2.png"],
  "anchor-roma-6a-switch-10pack": ["/products/dog.png", "/products/mussoorie.png"],
  "polycab-1-5sqmm-wire-90m": ["/products/couple.png", "/products/sosyo.png"],
  "orient-400mm-table-fan": ["/products/clock.png", "/products/bike1.png"],
  "bajaj-1000w-room-heater": ["/products/metro1.png", "/products/dog.png"],
  "luminous-900va-inverter": ["/products/mussoorie.png", "/products/couple.png"],
};

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  for (const [slug, imgs] of Object.entries(images)) {
    const result = await db.collection("products").updateOne(
      { slug },
      { $set: { images: imgs } }
    );
    console.log(`${slug}: ${result.modifiedCount ? "updated" : "not found"}`);
  }

  await mongoose.disconnect();
  console.log("All product images updated!");
}

run().catch(console.error);
