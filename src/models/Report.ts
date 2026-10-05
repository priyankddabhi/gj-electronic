import mongoose, { Schema, type Document } from "mongoose";

export const REPORT_TYPES = ["complaint", "query", "report"] as const;
export const REPORT_STATUSES = ["new", "read", "resolved"] as const;

export interface IReport extends Document {
  name: string;
  phone: string;
  type: (typeof REPORT_TYPES)[number];
  message: string;
  refId: string;
  status: (typeof REPORT_STATUSES)[number];
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    name: { type: String, required: true, maxlength: 100 },
    phone: { type: String, required: true },
    type: { type: String, enum: REPORT_TYPES, default: "complaint" },
    message: { type: String, required: true, maxlength: 2000 },
    refId: { type: String, default: "", maxlength: 40 },
    status: { type: String, enum: REPORT_STATUSES, default: "new" },
  },
  { timestamps: true }
);

ReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Report ||
  mongoose.model<IReport>("Report", ReportSchema);
