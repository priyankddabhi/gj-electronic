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
    | "applied"
    | "received"
    | "diagnosing"
    | "repairing"
    | "testing"
    | "ready"
    | "delivered";
  repairMethod: "electrician-visit" | "shop-repair" | null;
  electricianName: string;
  electricianPhone: string;
  estimatedPickupTime: string;
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
      enum: ["applied", "received", "diagnosing", "repairing", "testing", "ready", "delivered"],
      default: "applied",
    },
    repairMethod: { type: String, enum: ["electrician-visit", "shop-repair"], default: null },
    electricianName: { type: String, default: "" },
    electricianPhone: { type: String, default: "" },
    estimatedPickupTime: { type: String, default: "" },
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

// In dev, hot reload keeps an old compiled schema in mongoose.models; strict mode then silently drops new fields.
if (process.env.NODE_ENV !== "production" && mongoose.models.Repair) mongoose.deleteModel("Repair");

export default mongoose.models.Repair ||
  mongoose.model<IRepair>("Repair", RepairSchema);
