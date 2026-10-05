import mongoose, { Schema, type Document, type Types } from "mongoose";

// One star rating (1–5) + optional written review per customer per product.
// Only customers with a Delivered order for the product can rate (checked in the API).
export interface IRating extends Document {
  product: Types.ObjectId;
  customer: Types.ObjectId;
  customerName: string;
  stars: number;
  review: string;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: { type: String, default: "" },
    stars: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: "", maxlength: 500 },
    // Admin can hide a review; hidden ratings don't count in the average
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RatingSchema.index({ product: 1, customer: 1 }, { unique: true });

export default mongoose.models.Rating || mongoose.model<IRating>("Rating", RatingSchema);
