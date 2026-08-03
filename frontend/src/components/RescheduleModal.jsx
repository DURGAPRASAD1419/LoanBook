import { useState } from "react";
import { TextField } from "./FormField";
import { X } from "lucide-react";

function formatInputDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function RescheduleModal({ loan, due, onClose, onConfirm }) {
  const defaultDate = formatInputDate(
    new Date(new Date(due.dueDate.split("/").reverse().join("-")).getTime() + 7 * 24 * 60 * 60 * 1000)
  );
  const [newDueDate, setNewDueDate] = useState(defaultDate);
  const [reason, setReason] = useState("");

  function handleReschedule() {
    if (!newDueDate) {
      alert("Please choose a new due date.");
      return;
    }
    onConfirm({
      dueDate: newDueDate.split("-").reverse().join("/"),
      rescheduledBy: "Admin",
      rescheduleReason: reason || "Rescheduled due to missed visit",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="bg-white w-full rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Reschedule Due</h2>
          <button onClick={onClose} className="text-gray-500" aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-3">
          <TextField label="Loan" value={loan.id} disabled />
          <TextField label="Borrower" value={loan.borrowerName} disabled />
          <TextField label="Due No" value={due.dueNo} disabled />
          <TextField label="Current Due Date" value={due.dueDate} disabled />
          <TextField
            label="New Due Date"
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional explanation"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-white py-3.5 font-semibold text-gray-700 shadow-md border-none"
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            className="flex-1 rounded-2xl bg-blue-700 py-3.5 font-semibold text-white shadow-md border-none"
          >
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}
