import mongoose, { Schema, type Document } from "mongoose";

export interface IElectrician extends Document {
  name: string;
  phone: string;
  skills: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ElectricianSchema = new Schema<IElectrician>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    skills: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Electrician ||
  mongoose.model<IElectrician>("Electrician", ElectricianSchema);
