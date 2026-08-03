import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HandCoins, Printer } from "lucide-react";
import Header from "../components/Header";
import PaymentModal from "../components/PaymentModal";
import PaymentSuccessModal from "../components/PaymentSuccessModal";
import RescheduleModal from "../components/RescheduleModal";
import { useData } from "../context/DataContext";
import { openPrintWindow } from "../utils/exportUtils";

function isOverdue(due) {
  if (!due || due.paid || !due.dueDate) return false;
  const [dd, mm, yy] = due.dueDate.split("/").map(Number);
  if (!dd || !mm || !yy) return false;
  const dueDate = new Date(yy, mm - 1, dd);
  return dueDate < new Date();
}

export default function LoanTransactions() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const { loans, payDue, rescheduleDue, loanStats } = useData();
  const [activeDue, setActiveDue] = useState(null);
  const [rescheduleDueItem, setRescheduleDueItem] = useState(null);
  const [successDue, setSuccessDue] = useState(null);

  const loan = loans.find((l) => l.id === loanId);

  if (!loan) {
    return (
      <div className="app-shell">
        <Header title="Not found" showBack />
        <div className="p-6 text-gray-500">This loan could not be found.</div>
      </div>
    );
  }

  const stats = loanStats(loan);
  const nextDue = loan.dues.find((d) => !d.paid);
  const paidHistory = loan.dues.filter((due) => due.paid).slice().reverse();

  async function handleConfirmPayment(payment) {
    try {
      await payDue(loan.id, activeDue.dueNo, payment);
      setSuccessDue({ ...activeDue, paidDate: payment.paidDate });
      setActiveDue(null);
    } catch (err) {
      alert(err.message || "Unable to record payment. Please try again.");
    }
  }

  async function handleConfirmReschedule(payload) {
    try {
      await rescheduleDue(loan.id, rescheduleDueItem.dueNo, payload);
      setRescheduleDueItem(null);
    } catch (err) {
      alert(err.message || "Unable to reschedule the due. Please try again.");
    }
  }

  return (
    <div className="app-shell">
      <Header title={`${loan.id} Transactions`} showBack />

      <div className="px-3 pt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate(`/loan/${loan.id}/edit`)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm sm:w-auto"
        >
          Edit Loan
        </button>

        <button
          onClick={() => {
            const rowsHtml = [`
              <div class=\"section\"><h1>Payment Receipt</h1></div>
              <div class=\"section\">
                <table>
                  <tbody>
                    <tr><th>Borrower</th><td>${loan.borrowerName}</td></tr>
                    <tr><th>Collection Type</th><td>${loan.collectionType}</td></tr>
                    <tr><th>Loan Amount</th><td>₹${Number(loan.loanAmount || 0).toLocaleString("en-IN")}</td></tr>
                    <tr><th>Interest</th><td>${loan.interest || 0}%</td></tr>
                    <tr><th>Installments</th><td>${loan.installment || 0}</td></tr>
                    <tr><th>EMI</th><td>₹${loan.loanPerInstallment || 0}</td></tr>
                    <tr><th>Start Date</th><td>${loan.startDate || "-"}</td></tr>
                    <tr><th>End Date</th><td>${loan.endDate || "-"}</td></tr>
                  </tbody>
                </table>
              </div>
              <div class=\"section\"><h2>Payment history</h2></div>
              <table>
                <thead>
                  <tr>
                    <th>Due #</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${(loan.dues || [])
                    .map((due) => `
                      <tr>
                        <td>${due.dueNo}</td>
                        <td>${due.dueDate || "-"}</td>
                        <td>₹${Number(due.paidAmount || due.dueAmount || 0).toLocaleString("en-IN")}</td>
                        <td>${due.paid ? "Paid" : "Pending"}</td>
                        <td>${due.paidDate || "-"}</td>
                      </tr>
                    `)
                    .join("")}
                </tbody>
              </table>
            `];
            openPrintWindow(rowsHtml.join(""), "Payment Receipt");
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm sm:w-auto"
        >
          <Printer size={16} className="inline-block mr-2" /> Print Receipt
        </button>
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar pb-24 bg-gray-50">
        <div className="p-3">
          <div className="rounded-2xl bg-white shadow-md p-4 border-none">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{loan.borrowerName}</span>
                  <span className="font-semibold">{loan.id}</span>
                </div>
                <p className="text-gray-500 text-sm">Loan details</p>
                <div className="mt-1 text-xs text-gray-600">
                  {nextDue ? nextDue.dueDate : loan.endDate} &nbsp; {nextDue ? nextDue.dueNo : 0}
                </div>
              </div>
              <span className="bg-primary text-white text-[11px] font-semibold rounded-md px-2 py-1 self-center">
                EMI ₹{loan.loanPerInstallment}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-2 text-center">
              <div>
                <p className="text-gray-400 text-[10px]">Total [{loan.installment}]</p>
                <p className="text-sm font-medium">₹{stats.total}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Paid [{loan.dues.filter((d) => d.paid).length}]</p>
                <p className="text-sm font-medium">₹{stats.paid}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Pending [{nextDue ? 1 : 0}]</p>
                <p className="text-sm font-medium">₹{stats.pending}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Balance</p>
                <p className="text-sm font-medium">₹{stats.balance}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Payment history</h3>
            <span className="text-xs text-gray-500">{paidHistory.length} paid</span>
          </div>

          {paidHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">
              No payment history yet.
            </div>
          ) : (
            <div className="space-y-2">
              {paidHistory.map((due) => (
                <div key={`${due.dueNo}-${due.paidDate}`} className="rounded-2xl bg-white shadow-md px-4 py-3 border-none">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800">Due {due.dueNo}</span>
                    <span className="text-xs rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700">
                      Paid
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{due.paidDate}</span>
                    <span>{due.collectedBy || "Admin"}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-gray-900">₹{Number(due.paidAmount || due.dueAmount || 0).toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="py-2 px-3 text-left font-normal">Due</th>
              <th className="py-2 px-3 text-left font-normal">Date</th>
              <th className="py-2 px-3 text-left font-normal">Amount</th>
              <th className="py-2 px-3 text-left font-normal">Action</th>
            </tr>
          </thead>
          <tbody>
            {loan.dues.map((due) => {
              const overdue = isOverdue(due);
              return (
                <tr
                  key={due.dueNo}
                  className={`border-b border-gray-100 ${due.paid ? "text-gray-400" : ""} ${overdue && !due.paid ? "bg-red-50" : ""}`}
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span>{due.dueNo}</span>
                      {overdue && !due.paid && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                          Overdue
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">{due.dueDate}</td>
                  <td className="py-2 px-3">₹{due.paid ? due.paidAmount : due.dueAmount}</td>
                  <td className="py-2 px-3">
                    {!due.paid ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDue(due);
                          }}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-2.5 py-1 text-white text-xs font-semibold"
                        >
                          Pay now
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRescheduleDueItem(due);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Reschedule
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Paid</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>

      {nextDue && (
        <button
          onClick={() => setActiveDue(nextDue)}
          className="fixed bottom-6 right-6 bg-primary text-white rounded-full pl-4 pr-5 py-3 flex items-center gap-2 shadow-lg font-medium"
          style={{ maxWidth: 480 }}
        >
          <HandCoins size={20} /> PAY NOW
        </button>
      )}

      {activeDue && (
        <PaymentModal
          loan={loan}
          due={activeDue}
          onClose={() => setActiveDue(null)}
          onConfirm={handleConfirmPayment}
        />
      )}

      {rescheduleDueItem && (
        <RescheduleModal
          loan={loan}
          due={rescheduleDueItem}
          onClose={() => setRescheduleDueItem(null)}
          onConfirm={handleConfirmReschedule}
        />
      )}

      {successDue && (
        <PaymentSuccessModal
          loan={loan}
          due={successDue}
          onClose={() => setSuccessDue(null)}
        />
      )}
    </div>
  );
}
