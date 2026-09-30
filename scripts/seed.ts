import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/gj-electronic";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;

  // Create admin user
  const adminExists = await db.collection("admins").findOne({ username: "admin" });
  if (!adminExists) {
    await db.collection("admins").insertOne({
      username: "admin",
      password: "admin123",
      createdAt: new Date(),
    });
    console.log("Admin user created (username: admin, password: admin123)");
  } else {
    console.log("Admin user already exists");
  }

  // Sample products
  const productCount = await db.collection("products").countDocuments();
  if (productCount === 0) {
    const products = [
      {
        name: "Havells 1200mm Ceiling Fan",
        slug: "havells-1200mm-ceiling-fan",
        description: "Energy efficient ceiling fan with smooth operation and elegant design",
        price: 1850,
        mrp: 2200,
        category: "Fans",
        brand: "Havells",
        images: [],
        specifications: { "Sweep Size": "1200mm", "Speed": "390 RPM", "Power": "72W", "Color": "White" },
        warrantyType: "brand",
        warrantyDuration: 24,
        warrantyTerms: "Manufacturing defects",
        inStock: true,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Philips 9W LED Bulb (Pack of 4)",
        slug: "philips-9w-led-bulb-4pack",
        description: "Long-lasting LED bulbs with bright white light and energy savings",
        price: 320,
        mrp: 450,
        category: "Bulbs",
        brand: "Philips",
        images: [],
        specifications: { "Wattage": "9W", "Type": "LED", "Base": "B22", "Color": "Cool White" },
        warrantyType: "brand",
        warrantyDuration: 12,
        warrantyTerms: "Replacement warranty",
        inStock: true,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Wipro 20W LED Batten Light",
        slug: "wipro-20w-led-batten",
        description: "Slim batten light for living room and bedroom with uniform lighting",
        price: 380,
        mrp: 500,
        category: "Lights",
        brand: "Wipro",
        images: [],
        specifications: { "Wattage": "20W", "Length": "2ft", "Type": "LED Batten", "Color": "Cool Daylight" },
        warrantyType: "brand",
        warrantyDuration: 24,
        warrantyTerms: "Manufacturing defects",
        inStock: true,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Anchor Roma 6A Switch (Pack of 10)",
        slug: "anchor-roma-6a-switch-10pack",
        description: "Premium quality modular switches for home and office",
        price: 280,
        mrp: 350,
        category: "Switches",
        brand: "Anchor",
        images: [],
        specifications: { "Rating": "6A 250V", "Type": "1-Way", "Color": "White", "Module Size": "1M" },
        warrantyType: "brand",
        warrantyDuration: 12,
        warrantyTerms: "Manufacturing defects",
        inStock: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Polycab 1.5 sq mm Wire (90m)",
        slug: "polycab-1-5sqmm-wire-90m",
        description: "FR PVC insulated copper wire for household wiring",
        price: 1650,
        mrp: 1900,
        category: "Wires",
        brand: "Polycab",
        images: [],
        specifications: { "Size": "1.5 sq mm", "Length": "90 meters", "Material": "Copper", "Insulation": "FR PVC" },
        warrantyType: "brand",
        warrantyDuration: 0,
        warrantyTerms: "",
        inStock: true,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Orient 400mm Table Fan",
        slug: "orient-400mm-table-fan",
        description: "Powerful table fan with adjustable tilt and speed control",
        price: 1450,
        mrp: 1750,
        category: "Fans",
        brand: "Orient",
        images: [],
        specifications: { "Sweep": "400mm", "Speed": "1350 RPM", "Power": "55W", "Blades": "3" },
        warrantyType: "brand",
        warrantyDuration: 24,
        warrantyTerms: "Motor warranty",
        inStock: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bajaj 1000W Room Heater",
        slug: "bajaj-1000w-room-heater",
        description: "Compact room heater with safety tip-over switch",
        price: 1100,
        mrp: 1400,
        category: "Heaters",
        brand: "Bajaj",
        images: [],
        specifications: { "Power": "1000W", "Type": "Radiant", "Heating Element": "Quartz", "Safety": "Tip-over switch" },
        warrantyType: "brand",
        warrantyDuration: 12,
        warrantyTerms: "Manufacturing defects",
        inStock: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Luminous 900VA Inverter",
        slug: "luminous-900va-inverter",
        description: "Home UPS inverter with intelligent battery management",
        price: 4200,
        mrp: 5000,
        category: "Inverters",
        brand: "Luminous",
        images: [],
        specifications: { "Capacity": "900VA", "Battery": "12V", "Waveform": "Pure Sine Wave", "Charging": "15A" },
        warrantyType: "brand",
        warrantyDuration: 24,
        warrantyTerms: "Manufacturing defects",
        inStock: true,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("products").insertMany(products);
    console.log(`Inserted ${products.length} sample products`);
  } else {
    console.log(`Products already exist (${productCount})`);
  }

  await mongoose.disconnect();
  console.log("Seed complete!");
}

seed().catch(console.error);
