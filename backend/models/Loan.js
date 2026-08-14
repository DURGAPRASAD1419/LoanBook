import mongoose from "mongoose";

const dueSchema = new mongoose.Schema(
  {
    dueNo: Number,
    dueAmount: Number,
    dueDate: String,
    paid: Boolean,
    paidAmount: Number,
    paidDate: String,
    collectedBy: String,
    rescheduledBy: String,
    rescheduleReason: String,
  },
  { _id: false }
);

const loanSchema = new mongoose.Schema(
  {
    loanId: { type: String, required: true, unique: true },
    createdBy: String,
    borrowerId: String,
    borrowerName: String,
    collectionType: String,
    loanAmount: Number,
    interest: Number,
    installment: Number,
    loanPerInstallment: Number,
    startDate: String,
    endDate: String,
    amountDisbursed: Number,
    alreadyPaid: Number,
    dues: [dueSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.models.Loan || mongoose.model("Loan", loanSchema);
