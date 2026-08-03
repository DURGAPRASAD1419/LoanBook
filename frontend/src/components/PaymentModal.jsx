import { useState } from "react";
import { TextField, SelectField } from "./FormField";

const COLLECTORS = ["Admin", "Agent 1", "Agent 2"];

export default function PaymentModal({ loan, due, onClose, onConfirm }) {
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [collectedBy, setCollectedBy] = useState("");
  const [showCollectorPicker, setShowCollectorPicker] = useState(false);

  function handlePay() {
    if (!collectedBy) {
      alert("Please select who collected the payment.");
      return;
    }
    const formatted = new Date(paidDate).toLocaleDateString("en-GB");
    onConfirm({ paidDate: formatted, collectedBy });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="bg-white w-full rounded-2xl p-5 max-h-[85vh] overflow-y-auto shadow-xl">
        <h2 className="text-xl font-bold text-center mb-4">{loan.id} Payment</h2>

        <TextField label="Name" value={loan.borrowerName} disabled />
        <TextField label="Due No" value={due.dueNo} disabled />
        <TextField label="Due Amount" value={`₹ ${due.dueAmount.toLocaleString("en-IN")}`} disabled />
        <TextField label="Due Date" value={due.dueDate} disabled />
        <TextField
          label="Paid Date"
          type="date"
          value={paidDate}
          onChange={(e) => setPaidDate(e.target.value)}
        />
        <SelectField
          label="Collected By"
          value={collectedBy}
          onClick={() => setShowCollectorPicker(true)}
        />

        {showCollectorPicker && (
          <div className="mt-2 bg-white rounded-2xl shadow-md p-2 border-none">
            {COLLECTORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCollectedBy(c);
                  setShowCollectorPicker(false);
                }}
                className="w-full text-left px-4 py-3 last:rounded-b-2xl hover:bg-gray-50"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-white rounded-2xl py-3.5 font-semibold shadow-md border-none"
          >
            CLOSE
          </button>
          <button
            onClick={handlePay}
            className="flex-1 bg-primary text-white rounded-2xl py-3.5 font-semibold shadow-md border-none"
          >
            PAY LOAN
          </button>
        </div>
      </div>
    </div>
  );
}
