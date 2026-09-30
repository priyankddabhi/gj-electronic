import mongoose, { Schema, type Document } from "mongoose";

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IOrder extends Document {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryType: "delivery" | "pickup";
  items: IOrderItem[];
  total: number;
  status: "placed" | "confirmed" | "dispatched" | "delivered";
  paymentStatus: "unpaid" | "paid";
  paymentMethod: "cash" | "online";
  statusHistory: { status: string; date: Date; note: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: "" },
    deliveryType: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["placed", "confirmed", "dispatched", "delivered"],
      default: "placed",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
    },
    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

OrderSchema.index({ phone: 1 });
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ status: 1 });

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
