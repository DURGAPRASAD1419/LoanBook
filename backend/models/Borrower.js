import mongoose from "mongoose";

const borrowerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    aadhar: String,
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    mobile: { type: String, required: true },
    mobile2: String,
    shopWork: { type: String, required: true },
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.models.Borrower || mongoose.model("Borrower", borrowerSchema);
