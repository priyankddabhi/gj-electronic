import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  category: string;
  brand: string;
  images: string[];
  specifications: Record<string, string>;
  warrantyType: "shop" | "brand" | "none";
  warrantyDuration: number;
  warrantyTerms: string;
  inStock: boolean;
  featured: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    brand: { type: String, default: "" },
    images: [{ type: String }],
    specifications: { type: Schema.Types.Mixed, default: {} },
    warrantyType: {
      type: String,
      enum: ["shop", "brand", "none"],
      default: "none",
    },
    warrantyDuration: { type: Number, default: 0 },
    warrantyTerms: { type: String, default: "" },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    // Kept up to date by /api/products/[id]/rate, used for the Popularity sort
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text", brand: "text" });
ProductSchema.index({ category: 1 });
ProductSchema.index({ featured: 1 });

export default mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);
