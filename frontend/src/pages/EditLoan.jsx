import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useData } from "../context/DataContext";

function Field({ label, disabled = false, children }) {
  return (
    <div className="mt-4">
      <label className="block text-gray-500 text-[13px] mb-1">{label}</label>
      {children}
    </div>
  );
}

function inputClass(disabled) {
  return `w-full rounded-md border px-3 py-2 text-[14px] text-gray-900 ${
    disabled ? "bg-gray-100 border-gray-200 text-gray-500" : "bg-white border-gray-300"
  }`;
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

export default function EditLoan() {
  const navigate = useNavigate();
  const { loanId } = useParams();
  const { loans, updateLoan } = useData();

  const existing = loans.find((loan) => loan.id === loanId);

  const [form, setForm] = useState({
    borrowerId: "",
    borrowerName: "",
    collectionType: "Daily",
    loanAmount: "",
    interest: "",
    installment: "",
    startDate: "",
    amountDisbursed: "",
    alreadyPaid: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        borrowerId: existing.borrowerId || "",
        borrowerName: existing.borrowerName || "",
        collectionType: existing.collectionType || "Daily",
        loanAmount: existing.loanAmount ?? "",
        interest: existing.interest ?? "",
        installment: existing.installment ?? "",
        startDate: existing.startDate ? new Date(existing.startDate.split("/").reverse().join("-")) .toISOString().slice(0, 10) : "",
        amountDisbursed: existing.amountDisbursed ?? existing.loanAmount ?? "",
        alreadyPaid:
          existing.alreadyPaid ??
          existing.dues?.reduce((sum, due) => sum + (due.paidAmount || 0), 0) ??
          "",
      });
    }
  }, [existing]);

  const installmentNum = Number(form.installment) || 0;
  const loanAmountNum = Number(form.loanAmount) || 0;
  const interestNum = Number(form.interest) || 0;
  const loanPerInstallment = useMemo(() => {
    if (!installmentNum || !loanAmountNum) return 0;
    return Math.round((loanAmountNum + loanAmountNum * (interestNum / 100)) / installmentNum);
  }, [loanAmountNum, interestNum, installmentNum]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function endDatePreview() {
    if (!form.startDate || !installmentNum) return "";
    const d = new Date(form.startDate);
    const end = addInterval(d, form.collectionType, installmentNum - 1);
    return end.toLocaleDateString("en-GB");
  }

  async function handleSave() {
    if (!form.borrowerName || !loanAmountNum || !installmentNum) {
      alert("Please fill borrower, amount, and installment.");
      return;
    }

    try {
      await updateLoan(loanId, {
        ...form,
        loanPerInstallment,
      });
      navigate(`/loan/${loanId}`);
    } catch (err) {
      alert(err.message || "Unable to update loan.");
    }
  }

    if (!existing) {
    return (
      <div className="app-shell">
        <header className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-20">
          <button onClick={() => navigate(-1)} className="text-primary" aria-label="Go back">
            <ArrowLeft size={26} />
          </button>
          <h1 className="text-2xl font-bold text-primary">Edit Loan</h1>
        </header>
        <main className="p-6 text-gray-500 bg-gray-50">Loan not found.</main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-primary" aria-label="Go back">
          <ArrowLeft size={26} />
        </button>
        <h1 className="text-2xl font-bold text-primary">Edit Loan</h1>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-6 bg-gray-50">
        <div className="rounded-2xl bg-white shadow-md p-5 border-none space-y-4">
          <Field label="Borrower">
          <input
            value={form.borrowerName}
            onChange={(e) => update("borrowerName", e.target.value)}
            className={inputClass(false)}
          />
        </Field>

        <div className="flex justify-between pb-3 border-b border-gray-200 mt-4">
          {['Daily', 'Weekly', 'Monthly'].map((t) => (
            <label key={t} className="flex items-start gap-1.5 text-[13px] max-w-[30%]">
              <input
                type="radio"
                name="collectionType"
                checked={form.collectionType === t}
                onChange={() => update("collectionType", t)}
                className="w-4 h-4 accent-primary mt-0.5 shrink-0"
              />
              <span className={form.collectionType === t ? "text-primary font-semibold leading-snug" : "text-gray-600 leading-snug"}>
                {t} Collections
              </span>
            </label>
          ))}
        </div>

        <Field label="Loan Amount">
          <input
            type="number"
            value={form.loanAmount}
            onChange={(e) => update("loanAmount", e.target.value)}
            className={inputClass(false)}
          />
        </Field>

        <Field label="Interest">
          <input
            type="number"
            value={form.interest}
            onChange={(e) => update("interest", e.target.value)}
            onWheel={(e) => e.target.blur()}
            className={inputClass(false)}
          />
        </Field>

        <Field label="Installment">
          <input
            type="number"
            value={form.installment}
            onChange={(e) => update("installment", e.target.value)}
            onWheel={(e) => e.target.blur()}
            className={inputClass(false)}
          />
        </Field>

        <Field label="Loan Per Installment" disabled>
          <input value={loanPerInstallment || ""} disabled className={inputClass(true)} />
        </Field>

        <Field label="First due date">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className={inputClass(false)}
          />
        </Field>

        <Field label="End Date" disabled>
          <input value={endDatePreview()} disabled className={inputClass(true)} />
        </Field>

        <Field label="Amount Disbursed">
          <input
            type="number"
            value={form.amountDisbursed}
            onChange={(e) => update("amountDisbursed", e.target.value)}
            className={inputClass(false)}
          />
        </Field>

        <Field label="If Already Paid Amount">
          <input
            type="number"
            value={form.alreadyPaid}
            onChange={(e) => update("alreadyPaid", e.target.value)}
            className={inputClass(false)}
          />
        </Field>

          <button
            onClick={handleSave}
            className="w-full bg-primary text-white rounded-2xl py-3 font-bold mt-1 shadow-md"
          >
          SAVE CHANGES
          </button>
        </div>
      </main>
    </div>
  );
}
