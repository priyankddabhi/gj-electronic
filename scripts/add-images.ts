import mongoose from "mongoose";

const MONGODB_URI = "mongodb://127.0.0.1:27017/gj-electronic";

const images: Record<string, string[]> = {
  "havells-1200mm-ceiling-fan": [
    "https://placehold.co/600x600/f0f4ff/1a56db?text=Havells+Ceiling+Fan",
    "https://placehold.co/600x600/e8f0fe/1a56db?text=Fan+Top+View",
  ],
  "philips-9w-led-bulb-4pack": [
    "https://placehold.co/600x600/fffbe6/b8860b?text=Philips+LED+Bulb",
    "https://placehold.co/600x600/fef3c7/b8860b?text=4+Pack+Box",
  ],
  "wipro-20w-led-batten": [
    "https://placehold.co/600x600/f0fdf4/166534?text=Wipro+Batten+Light",
    "https://placehold.co/600x600/dcfce7/166534?text=Installed+View",
  ],
  "anchor-roma-6a-switch-10pack": [
    "https://placehold.co/600x600/fef2f2/991b1b?text=Anchor+Switch",
    "https://placehold.co/600x600/fee2e2/991b1b?text=10+Pack",
  ],
  "polycab-1-5sqmm-wire-90m": [
    "https://placehold.co/600x600/fefce8/854d0e?text=Polycab+Wire+90m",
    "https://placehold.co/600x600/fef9c3/854d0e?text=Wire+Coil",
  ],
  "orient-400mm-table-fan": [
    "https://placehold.co/600x600/eff6ff/1e40af?text=Orient+Table+Fan",
    "https://placehold.co/600x600/dbeafe/1e40af?text=Fan+Side+View",
  ],
  "bajaj-1000w-room-heater": [
    "https://placehold.co/600x600/fff1f2/be123c?text=Bajaj+Room+Heater",
    "https://placehold.co/600x600/ffe4e6/be123c?text=Heater+Front",
  ],
  "luminous-900va-inverter": [
    "https://placehold.co/600x600/f0f9ff/0c4a6e?text=Luminous+Inverter",
    "https://placehold.co/600x600/e0f2fe/0c4a6e?text=Inverter+Panel",
  ],
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
  console.log("All product images added!");
}

run().catch(console.error);
