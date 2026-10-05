import mongoose from "mongoose";
import Product from "@/models/Product";
import Rating from "@/models/Rating";

// Recalculate a product's average stars and count from visible (not hidden) ratings
export async function refreshProductRating(productId: mongoose.Types.ObjectId | string) {
  const id = new mongoose.Types.ObjectId(String(productId));
  const [agg] = await Rating.aggregate<{ avg: number; count: number }>([
    { $match: { product: id, hidden: { $ne: true } } },
    { $group: { _id: null, avg: { $avg: "$stars" }, count: { $sum: 1 } } },
  ]);
  const ratingAvg = Math.round((agg?.avg ?? 0) * 10) / 10;
  const ratingCount = agg?.count ?? 0;
  await Product.updateOne({ _id: id }, { $set: { ratingAvg, ratingCount } });
  return { ratingAvg, ratingCount };
}
