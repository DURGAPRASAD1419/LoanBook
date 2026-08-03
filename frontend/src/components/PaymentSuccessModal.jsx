import { X, Check } from "lucide-react";

export default function PaymentSuccessModal({ loan, due, onClose }) {
  const totalLoanAmount = Number(loan?.loanAmount || 0) +
    (Number(loan?.loanAmount || 0) * (Number(loan?.interest || 0) / 100));

  const totalPaid = (loan?.dues || []).reduce((sum, item) => {
    if (!item?.paid) return sum;
    return sum + Number(item?.paidAmount || item?.dueAmount || 0);
  }, 0);

  const remainingBalance = Math.max(totalLoanAmount - totalPaid, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      style={{ maxWidth: 480, margin: "0 auto" }}
    >
      <div className="receipt-print-area bg-white w-full rounded-2xl p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="print-hide absolute top-4 right-4 text-red-500"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
            <Check size={34} className="text-white" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-emerald-500">Payment Successful!</h2>
          <p className="text-gray-700 mt-1">Payment receipt</p>

          <div className="w-full border-t border-dashed border-gray-300 my-5" />

          <div className="w-full space-y-2 text-[15px]">
            <div className="flex justify-between gap-3"><span className="text-gray-500">Borrower</span><span className="font-semibold text-right">{loan.borrowerName}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Due No</span><span className="font-semibold text-right">{due.dueNo}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Due Date</span><span className="font-semibold text-right">{due.dueDate}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Paid Date</span><span className="font-semibold text-right">{due.paidDate}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Collected By</span><span className="font-semibold text-right">{due.collectedBy || "Admin"}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Amount Paid</span><span className="font-semibold text-right">₹ {Number(due.paidAmount || due.dueAmount || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Total Loan</span><span className="font-semibold text-right">₹ {totalLoanAmount.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Balance Left</span><span className="font-semibold text-right">₹ {remainingBalance.toLocaleString("en-IN")}</span></div>
          </div>

          <p className="text-2xl font-bold mt-5">₹ {Number(due.paidAmount || due.dueAmount || 0).toLocaleString("en-IN")}</p>

          <div className="w-full mt-6 space-y-3 print-hide">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full rounded-2xl bg-white py-3 font-semibold text-sm text-gray-800 shadow-md border-none"
            >
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-primary text-white py-3 font-semibold text-sm shadow-md border-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
