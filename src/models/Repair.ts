import mongoose, { Schema, type Document } from "mongoose";

export interface IRepair extends Document {
  trackingId: string;
  customerName: string;
  phone: string;
  deviceType: string;
  problemDescription: string;
  images: string[];
  preferredDate: string;
  status:
    | "received"
    | "diagnosing"
    | "repairing"
    | "testing"
    | "ready"
    | "delivered";
  estimatedCost: number | null;
  diagnosisNotes: string;
  statusHistory: { status: string; date: Date; note: string }[];
  paymentStatus: "unpaid" | "paid";
  paymentMethod: "cash" | "online";
  createdAt: Date;
  updatedAt: Date;
}

const RepairSchema = new Schema<IRepair>(
  {
    trackingId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    deviceType: { type: String, required: true },
    problemDescription: { type: String, required: true },
    images: [{ type: String }],
    preferredDate: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "received",
        "diagnosing",
        "repairing",
        "testing",
        "ready",
        "delivered",
      ],
      default: "received",
    },
    estimatedCost: { type: Number, default: null },
    diagnosisNotes: { type: String, default: "" },
    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
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
  },
  { timestamps: true }
);

RepairSchema.index({ phone: 1 });
RepairSchema.index({ trackingId: 1 });
RepairSchema.index({ status: 1 });

export default mongoose.models.Repair ||
  mongoose.model<IRepair>("Repair", RepairSchema);
