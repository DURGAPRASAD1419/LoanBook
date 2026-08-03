import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useData } from "../context/DataContext";

function parseDMY(str) {
  if (!str) return new Date(0);
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function formatMonthKey(dateStr) {
  const date = parseDMY(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function formatMonthLabel(dateStr) {
  const date = parseDMY(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default function History() {
  const navigate = useNavigate();
  const { loans, loanStats } = useData();
  const [selectedHistoryCard, setSelectedHistoryCard] = useState("payment-history");

  const paymentHistory = useMemo(() => {
    return loans
      .flatMap((loan) =>
        (loan.dues || [])
          .filter((due) => due.paid)
          .map((due) => ({
            borrowerName: loan.borrowerName || "Unknown borrower",
            loanId: loan.id || loan.loanId,
            dueNo: due.dueNo,
            paidDate: due.paidDate || "-",
            amount: Number(due.paidAmount || due.dueAmount || 0),
            monthKey: formatMonthKey(due.paidDate || due.dueDate || "01/01/2000"),
          }))
      )
      .sort((a, b) => parseDMY(b.paidDate || b.dueDate) - parseDMY(a.paidDate || a.dueDate));
  }, [loans]);

  const monthlyPaidSummary = useMemo(() => {
    const groups = new Map();
    paymentHistory.forEach((entry) => {
      if (!groups.has(entry.monthKey)) {
        groups.set(entry.monthKey, {
          key: entry.monthKey,
          label: formatMonthLabel(entry.paidDate || "01/01/2000"),
          total: 0,
        });
      }
      const current = groups.get(entry.monthKey);
      current.total += entry.amount;
    });

    return Array.from(groups.values()).sort((a, b) => {
      const [aMonth, aYear] = a.key.split("/").map(Number);
      const [bMonth, bYear] = b.key.split("/").map(Number);
      return new Date(bYear, bMonth - 1, 1) - new Date(aYear, aMonth - 1, 1);
    });
  }, [paymentHistory]);

  const borrowerPaymentDashboard = useMemo(() => {
    const map = new Map();

    loans.forEach((loan) => {
      const key = loan.borrowerId || loan.borrowerName || loan.id || loan.loanId;
      if (!map.has(key)) {
        map.set(key, {
          borrowerId: loan.borrowerId || key,
          borrowerName: loan.borrowerName || "Unknown borrower",
          totalPaid: 0,
          totalOutstanding: 0,
          lastPayment: null,
        });
      }

      const entry = map.get(key);
      const paid = (loan.dues || [])
        .filter((due) => due.paid)
        .reduce((sum, due) => sum + Number(due.paidAmount || due.dueAmount || 0), 0);
      const outstanding = Math.max(Number(loan.loanAmount || 0) - paid, 0);

      entry.totalPaid += paid;
      entry.totalOutstanding += outstanding;

      const lastPaymentDate = (loan.dues || [])
        .filter((due) => due.paid && due.paidDate)
        .map((due) => parseDMY(due.paidDate))
        .sort((a, b) => b - a)[0];

      if (lastPaymentDate && (!entry.lastPayment || lastPaymentDate > entry.lastPayment)) {
        entry.lastPayment = lastPaymentDate;
      }
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        lastPaymentLabel: row.lastPayment ? row.lastPayment.toLocaleDateString("en-GB") : "No payment",
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid);
  }, [loans]);

  const historyCards = [
    {
      id: "payment-history",
      title: "Payment history report",
      count: paymentHistory.length,
      render: (
        <div className="space-y-2">
          {paymentHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No payment history yet.</p>
          ) : (
            paymentHistory.slice(0, 8).map((entry, idx) => (
              <div key={`${entry.loanId}-${entry.dueNo}-${idx}`} className="rounded-2xl bg-white shadow-md px-4 py-3 border-none">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900">{entry.borrowerName}</span>
                  <span className="text-xs text-gray-500">{entry.loanId}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>Due {entry.dueNo}</span>
                  <span>{entry.paidDate}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-gray-900">₹{entry.amount.toLocaleString("en-IN")}</div>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: "monthly-paid",
      title: "Monthly paid amount summary",
      count: monthlyPaidSummary.length,
      render: (
        <div className="space-y-2">
          {monthlyPaidSummary.length === 0 ? (
            <p className="text-sm text-gray-500">No monthly payment data yet.</p>
          ) : (
            monthlyPaidSummary.slice(0, 6).map((month) => (
              <div key={month.key} className="rounded-2xl bg-white shadow-md flex items-center justify-between px-4 py-3 border-none">
                <span className="text-sm font-medium text-gray-700">{month.label}</span>
                <span className="text-sm font-bold text-gray-900">₹{month.total.toLocaleString("en-IN")}</span>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: "borrower-dashboard",
      title: "Payment dashboard by borrower",
      count: borrowerPaymentDashboard.length,
      render: (
        <div className="space-y-2">
          {borrowerPaymentDashboard.length === 0 ? (
            <p className="text-sm text-gray-500">No borrower payment data yet.</p>
          ) : (
            borrowerPaymentDashboard.slice(0, 6).map((row) => (
              <div key={row.borrowerId} className="rounded-2xl bg-white shadow-md px-4 py-3 border-none">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900">{row.borrowerName}</span>
                  <span className="text-xs text-gray-500">{row.lastPaymentLabel}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>Total paid</span>
                  <span className="font-semibold text-gray-900">₹{row.totalPaid.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>Outstanding</span>
                  <span className="font-semibold text-gray-900">₹{row.totalOutstanding.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
  ];

  const activeCard = historyCards.find((card) => card.id === selectedHistoryCard) || historyCards[0];

  return (
    <div className="app-shell">
      <Header
        title="Payment History"
        showBack
        showSearch
        showLogout
        onLogout={() => navigate("/login")}
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 py-5 flex flex-col gap-4 bg-gray-50">
        <div className="space-y-3">
          {historyCards.map((card) => {
            const isActive = selectedHistoryCard === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedHistoryCard(card.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  isActive ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-bold text-primary">{card.title}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600">
                    {card.count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-white shadow-md p-4 border-none">
          <h2 className="text-lg font-bold text-primary mb-3">{activeCard.title}</h2>
          {activeCard.render}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
