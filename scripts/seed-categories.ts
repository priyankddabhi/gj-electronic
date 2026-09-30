import mongoose from "mongoose";

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/gj-electronic");
  const db = mongoose.connection.db!;
  const count = await db.collection("categories").countDocuments();
  if (count === 0) {
    const cats = ["Fans","Lights","Bulbs","Switches","Wires","Motors","Inverters","Heaters","Other"];
    await db.collection("categories").insertMany(
      cats.map((name, i) => ({ name, order: i, createdAt: new Date() }))
    );
    console.log("Seeded", cats.length, "categories");
  } else {
    console.log("Categories already exist:", count);
  }
  await mongoose.disconnect();
}
run().catch(console.error);
