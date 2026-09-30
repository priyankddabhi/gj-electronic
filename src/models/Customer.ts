import mongoose, { Schema, type Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone: string;
  password: string;
  address: string;
  createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
