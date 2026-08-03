import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Borrower from "./models/Borrower.js";
import Loan from "./models/Loan.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });


const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("MONGO_URI is not defined in environment variables.");
}

mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB."))
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

async function createLoanId(collectionType) {
  const prefix = collectionType === "Weekly" ? "WL" : collectionType === "Monthly" ? "ML" : "DL";
  const loans = await Loan.find({ collectionType }, { loanId: 1 }).lean();
  const regex = new RegExp(`^${prefix}-(\\d+)$`);
  let maxNumber = 0;

  for (const loan of loans) {
    const match = regex.exec(loan.loanId);
    if (match) {
      maxNumber = Math.max(maxNumber, Number(match[1]));
    }
  }

  return `${prefix}-${maxNumber + 1}`;
}

function addInterval(date, collectionType, step = 1) {
  const next = new Date(date);
  if (collectionType === "Weekly") {
    next.setDate(next.getDate() + 7 * step);
  } else if (collectionType === "Monthly") {
    next.setMonth(next.getMonth() + step);
  } else {
    next.setDate(next.getDate() + step);
  }
  return next;
}

function buildDues(startDate, collectionType, installments, perInstallment, alreadyPaid = 0, dueNoOffset = 0) {
  const dues = [];
  let remainingPaid = Number(alreadyPaid) || 0;
  let currentDate = new Date(startDate);
  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(currentDate);
    let paidAmount = 0;
    if (remainingPaid >= perInstallment) {
      paidAmount = perInstallment;
      remainingPaid -= perInstallment;
    } else if (remainingPaid > 0) {
      paidAmount = remainingPaid;
      remainingPaid = 0;
    }
    dues.push({
      dueNo: dueNoOffset + i,
      dueAmount: perInstallment,
      dueDate: dueDate.toLocaleDateString("en-GB"),
      paid: paidAmount >= perInstallment,
      paidAmount,
      paidDate: paidAmount >= perInstallment ? dueDate.toLocaleDateString("en-GB") : null,
      collectedBy: paidAmount >= perInstallment ? "Admin" : null,
    });
    currentDate = addInterval(currentDate, collectionType, 1);
  }
  return dues;
}

function parseDMY(dateString) {
  const [d, m, y] = dateString.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function buildUpdatedDues(loan, collectionType, installments, perInstallment, startDate) {
  const paidDues = loan.dues.filter((due) => due.paid);
  const paidCount = paidDues.length;
  const adjustedInstallments = Math.max(installments, paidCount);
  const nextDueStart = (() => {
    if (paidCount === 0) {
      return new Date(startDate);
    }
    const lastPaidDue = paidDues[paidCount - 1];
    const lastPaidDate = parseDMY(lastPaidDue.dueDate) || new Date();
    const nextDate = addInterval(lastPaidDate, collectionType, 1);
    const requestedStart = new Date(startDate);
    return requestedStart > nextDate ? requestedStart : nextDate;
  })();

  const remainingInstallments = Math.max(adjustedInstallments - paidCount, 0);
  const preservedPaid = paidDues.map((due) => ({ ...due }));

  const newDues = [...preservedPaid];
  if (remainingInstallments > 0) {
    newDues.push(
      ...buildDues(nextDueStart, collectionType, remainingInstallments, perInstallment, 0, paidCount)
    );
  }

  return newDues;
}

app.get("/api/borrowers", async (req, res) => {
  const borrowers = await Borrower.find().sort({ createdAt: 1 });
  res.json(borrowers);
});

app.post("/api/borrowers", async (req, res) => {
  const { aadhar, name, fatherName, mobile, mobile2, shopWork, address } = req.body;
  if (!name || !fatherName || !mobile || !shopWork || !address) {
    return res.status(400).json({ message: "Missing required borrower fields." });
  }

  const count = await Borrower.countDocuments();
  const id = `B-${count + 1}`;
  const borrower = new Borrower({ id, aadhar, name, fatherName, mobile, mobile2, shopWork, address });
  await borrower.save();
  res.status(201).json(borrower);
});

app.delete("/api/borrowers/:id", async (req, res) => {
  const id = req.params.id;
  console.log("DELETE /api/borrowers/:id called with id=", id);
  // First try to find by custom `id` field
  let borrower = await Borrower.findOne({ id });

  // If not found, and id looks like a Mongo ObjectId, try _id lookup
  if (!borrower) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        borrower = await Borrower.findById(id);
      }
    } catch (err) {
      // ignore
    }
  }

  if (!borrower) {
    console.warn(`Borrower not found for id param: ${id}`);
    return res.status(404).json({ message: "Borrower not found." });
  }

  const borrowerIdValue = borrower.id || borrower._id;
  console.log("Deleting borrower record:", borrowerIdValue);

  // Remove borrower and any loans associated with them
  await Loan.deleteMany({ borrowerId: borrowerIdValue });
  await borrower.deleteOne();
  res.json({ message: "Borrower and related loans deleted." });
});

app.get("/api/loans", async (req, res) => {
  const loans = await Loan.find().sort({ createdAt: 1 });
  res.json(loans);
});

app.post("/api/loans", async (req, res) => {
  const {
    borrowerId,
    borrowerName,
    collectionType = "Daily",
    loanAmount,
    interest,
    installment,
    startDate,
    amountDisbursed,
    alreadyPaid,
  } = req.body;

  if (!borrowerId || !borrowerName || !loanAmount || !installment) {
    return res.status(400).json({ message: "Missing required loan fields." });
  }

  const loanId = await createLoanId(collectionType);
  const installments = Number(installment) || 1;
  const principal = Number(loanAmount) || 0;
  const interestRate = Number(interest) || 0;
  const perInstallment =
    principal > 0 ? Math.round((principal + principal * (interestRate / 100)) / installments) : 0;
  const start = startDate ? new Date(startDate) : new Date();
  const dues = buildDues(start, collectionType, installments, perInstallment, alreadyPaid);
  const endDate = addInterval(start, collectionType, installments - 1);
  const loan = new Loan({
    loanId,
    borrowerId,
    borrowerName,
    collectionType,
    loanAmount: Number(loanAmount),
    interest: Number(interest || 0),
    installment: installments,
    loanPerInstallment: perInstallment,
    startDate: start.toLocaleDateString("en-GB"),
    endDate: endDate.toLocaleDateString("en-GB"),
    amountDisbursed: Number(amountDisbursed || loanAmount),
    alreadyPaid: Number(alreadyPaid || 0),
    dues,
  });

  await loan.save();
  res.status(201).json(loan);
});

app.get("/api/loans/:loanId", async (req, res) => {
  const loan = await Loan.findOne({ loanId: req.params.loanId });
  if (!loan) {
    return res.status(404).json({ message: "Loan not found." });
  }
  res.json(loan);
});

app.put("/api/loans/:loanId", async (req, res) => {
  const loan = await Loan.findOne({ loanId: req.params.loanId });
  if (!loan) {
    return res.status(404).json({ message: "Loan not found." });
  }

  const {
    borrowerId,
    borrowerName,
    collectionType = loan.collectionType || "Daily",
    loanAmount,
    interest,
    installment,
    startDate,
    amountDisbursed,
    alreadyPaid,
  } = req.body;

  if (!borrowerName || !loanAmount || !installment) {
    return res.status(400).json({ message: "Missing required loan fields." });
  }

  const principal = Number(loanAmount) || 0;
  const installments = Number(installment) || 1;
  const interestRate = Number(interest) || 0;
  const perInstallment =
    principal > 0 ? Math.round((principal + principal * (interestRate / 100)) / installments) : 0;

  const requestedStart = startDate ? new Date(startDate) : parseDMY(loan.startDate) || new Date();
  const dues = buildUpdatedDues(loan, collectionType, installments, perInstallment, requestedStart);
  const endDate = dues.length
    ? parseDMY(dues[dues.length - 1].dueDate)
    : addInterval(requestedStart, collectionType, installments - 1);

  loan.borrowerId = borrowerId || loan.borrowerId;
  loan.borrowerName = borrowerName;
  loan.collectionType = collectionType;
  loan.loanAmount = Number(loanAmount);
  loan.interest = Number(interest || 0);
  loan.installment = installments;
  loan.loanPerInstallment = perInstallment;
  loan.startDate = loan.dues.filter((d) => d.paid).length === 0
    ? requestedStart.toLocaleDateString("en-GB")
    : loan.startDate;
  loan.endDate = endDate.toLocaleDateString("en-GB");
  loan.amountDisbursed = Number(amountDisbursed || loanAmount);
  loan.alreadyPaid = loan.dues.reduce((sum, due) => sum + (due.paidAmount || 0), 0);
  loan.dues = dues;

  await loan.save();
  res.json(loan);
});

app.delete("/api/loans/:loanId", async (req, res) => {
  const loan = await Loan.findOne({ loanId: req.params.loanId });
  if (!loan) {
    return res.status(404).json({ message: "Loan not found." });
  }

  await loan.deleteOne();
  res.json({ message: "Loan deleted." });
});

app.post("/api/backup", async (req, res) => {
  const borrowers = await Borrower.find().sort({ createdAt: 1 }).lean();
  const loans = await Loan.find().sort({ createdAt: 1 }).lean();

  const backup = {
    createdAt: new Date().toISOString(),
    borrowers,
    loans,
  };

  res.json(backup);
});

app.get("/api/loans/export", async (req, res) => {
  const loans = await Loan.find().sort({ createdAt: 1 }).lean();
  const payload = {
    exportedAt: new Date().toISOString(),
    loans,
  };

  res.setHeader('Content-Disposition', 'attachment; filename="loans.json"');
  res.type("application/json");
  res.send(JSON.stringify(payload, null, 2));
});

app.put("/api/loans/:loanId/pay", async (req, res) => {
  const { dueNo, paidDate, collectedBy } = req.body;
  const loan = await Loan.findOne({ loanId: req.params.loanId });
  if (!loan) {
    return res.status(404).json({ message: "Loan not found." });
  }

  const due = loan.dues.find((item) => item.dueNo === Number(dueNo));
  if (!due) {
    return res.status(404).json({ message: "Due not found." });
  }

  due.paid = true;
  due.paidAmount = due.dueAmount;
  due.paidDate = paidDate || new Date().toLocaleDateString("en-GB");
  due.collectedBy = collectedBy || "Admin";

  await loan.save();
  res.json(loan);
});

app.put("/api/loans/:loanId/due/:dueNo/reschedule", async (req, res) => {
  const { dueDate, rescheduledBy, rescheduleReason } = req.body;
  const loan = await Loan.findOne({ loanId: req.params.loanId });
  if (!loan) {
    return res.status(404).json({ message: "Loan not found." });
  }

  const dueIndex = loan.dues.findIndex((item) => item.dueNo === Number(req.params.dueNo));
  if (dueIndex === -1) {
    return res.status(404).json({ message: "Due not found." });
  }

  if (!dueDate) {
    return res.status(400).json({ message: "New due date is required." });
  }

  function parseDMY(dateString) {
    const [d, m, y] = dateString.split("/").map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  }

  function formatDMY(date) {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const dueDates = loan.dues.map((item) => parseDMY(item.dueDate));
  if (dueDates.some((date) => date === null)) {
    return res.status(400).json({ message: "Invalid due dates in loan record." });
  }

  const targetDate = parseDMY(dueDate);
  if (!targetDate) {
    return res.status(400).json({ message: "Invalid new due date format." });
  }

  const originalDate = dueDates[dueIndex];
  const nextDate = dueDates[dueIndex + 1];
  const prevDate = dueDates[dueIndex - 1];

  const interval = nextDate
    ? nextDate.getTime() - originalDate.getTime()
    : prevDate
    ? originalDate.getTime() - prevDate.getTime()
    : 7 * 24 * 60 * 60 * 1000;

  // Shift selected due and all later dues forward while keeping the chain intact.
  const newDates = dueDates.slice();
  newDates[dueIndex] = targetDate;

  for (let i = dueIndex + 1; i < newDates.length; i += 1) {
    const previous = newDates[i - 1];
    newDates[i] = new Date(previous.getTime() + interval);
  }

  loan.dues.slice(dueIndex).forEach((item, index) => {
    const duePosition = dueIndex + index;
    item.dueDate = formatDMY(newDates[duePosition]);
    if (duePosition === dueIndex) {
      item.rescheduledBy = rescheduledBy || "Admin";
      item.rescheduleReason = rescheduleReason || null;
    }
  });

  await loan.save();
  res.json(loan);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`LoanBook backend listening on port ${port}`);
});
