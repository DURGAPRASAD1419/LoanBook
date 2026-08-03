import { useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
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

const card = "bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.08)] p-4 border-none";
const innerCard = "rounded-2xl bg-white shadow-md p-3 border-none";
const itemCard = "rounded-2xl bg-white shadow-md px-4 py-3 border-none";
const summaryCard = "flex items-center justify-between rounded-2xl bg-white shadow-md px-4 py-3 border-none";

export default function Dashboard() {
  const { borrowers, loans, loanStats } = useData();
  const [selectedHistoryCard, setSelectedHistoryCard] = useState("payment-history");

  const overall = useMemo(() => {
    const totals = loans.reduce(
      (acc, loan) => {
        const s = loanStats(loan);
        acc.total += s.total;
        acc.paid += s.paid;
        acc.pending += s.pending;
        acc.balance += s.balance;
        return acc;
      },
      { total: 0, paid: 0, pending: 0, balance: 0 }
    );
    const percent = totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;
    return { ...totals, percent };
  }, [loans, loanStats]);

  const activeLoans = useMemo(() => {
    return loans.filter((loan) => loanStats(loan).balance > 0).length;
  }, [loans, loanStats]);

  const overdueLoansCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return loans.reduce((count, loan) => {
      const hasOverdue = (loan.dues || []).some(
        (d) => !d.paid && parseDMY(d.dueDate) < today
      );
      return count + (hasOverdue ? 1 : 0);
    }, 0);
  }, [loans]);

  const collectedThisWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((day + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return loans.reduce((sum, loan) => {
      return (
        sum +
        (loan.dues || []).reduce((dueSum, due) => {
          if (!due?.paid || !due.paidDate) return dueSum;
          const paidDate = parseDMY(due.paidDate);
          if (paidDate >= startOfWeek && paidDate < endOfWeek) {
            return dueSum + Number(due.paidAmount || due.dueAmount || 0);
          }
          return dueSum;
        }, 0)
      );
    }, 0);
  }, [loans]);

  const pendingCollectionAmount = useMemo(() => {
    return loans.reduce((sum, loan) => {
      return (
        sum +
        (loan.dues || []).reduce((dueSum, due) => {
          if (!due?.paid) {
            return dueSum + Number(due.dueAmount || loan.loanPerInstallment || 0);
          }
          return dueSum;
        }, 0)
      );
    }, 0);
  }, [loans]);

  const topBalanceBorrower = useMemo(() => {
    let best = null;
    let bestBalance = -1;
    loans.forEach((loan) => {
      const { balance } = loanStats(loan);
      if (balance > bestBalance) {
        bestBalance = balance;
        best = loan.borrowerName;
      }
    });
    return best;
  }, [loans, loanStats]);

  const byType = useMemo(() => {
    const groups = { Daily: [], Weekly: [], Monthly: [] };
    loans.forEach((l) => groups[l.collectionType]?.push(l));
    return groups;
  }, [loans]);

  function typeSummary(loanList) {
    const totals = loanList.reduce(
      (acc, loan) => {
        const s = loanStats(loan);
        acc.total += s.total;
        acc.paid += s.paid;
        return acc;
      },
      { total: 0, paid: 0 }
    );
    const percent = totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;
    // count unique borrowers rather than loan documents
    const borrowersSet = new Set(loanList.map((l) => l.borrowerId || l.borrowerName || l.loanId || l.id));
    return { ...totals, percent, count: borrowersSet.size };
  }

  const dailySummary = typeSummary(byType.Daily);
  const weeklySummary = typeSummary(byType.Weekly);
  const monthlySummary = typeSummary(byType.Monthly);

  const dailyCollectionSummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let collectedToday = 0;
    let dueToday = 0;
    let overdueCount = 0;

    loans.forEach((loan) => {
      (loan.dues || []).forEach((due) => {
        if (!due || !due.dueDate) return;

        const dueDate = parseDMY(due.dueDate);
        const dueAmount = Number(due.dueAmount || loan.loanPerInstallment || 0);

        if (dueDate.getTime() === today.getTime() && !due.paid) {
          dueToday += dueAmount;
        }

        if (due.paid && due.paidDate) {
          const paidDate = parseDMY(due.paidDate);
          if (paidDate.getTime() === today.getTime()) {
            collectedToday += Number(due.paidAmount || dueAmount || 0);
          }
        }

        if (!due.paid && dueDate < today) {
          overdueCount += 1;
        }
      });
    });

    return {
      collectedToday,
      dueToday,
      overdueCount,
      quickCollection: dueToday,
    };
  }, [loans]);

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
        groups.set(entry.monthKey, { key: entry.monthKey, label: formatMonthLabel(entry.paidDate || "01/01/2000"), total: 0 });
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
              <div key={`${entry.loanId}-${entry.dueNo}-${idx}`} className={itemCard}>
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
              <div key={month.key} className={summaryCard}>
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
              <div key={row.borrowerId} className={itemCard}>
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

  return (
    <div className="app-shell">
      <Header
        title="Dashboard"
        showSearch
        showHistory
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 py-5 bg-gray-50 flex flex-col gap-5">
        <div className={card}>
          <h3 className="text-primary font-bold text-lg mb-3">Daily collection summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={innerCard}>
              <p className="text-gray-500 text-xs">Total collected today</p>
              <p className="text-xl font-bold text-primary mt-1">
                ₹{dailyCollectionSummary.collectedToday.toLocaleString("en-IN")}
              </p>
            </div>
            <div className={innerCard}>
              <p className="text-gray-500 text-xs">Total due today</p>
              <p className="text-xl font-bold text-primary mt-1">
                ₹{dailyCollectionSummary.dueToday.toLocaleString("en-IN")}
              </p>
            </div>
            <div className={innerCard}>
              <p className="text-gray-500 text-xs">Total overdue count</p>
              <p className="text-xl font-bold text-primary mt-1">{dailyCollectionSummary.overdueCount}</p>
            </div>
            <div className={innerCard}>
              <p className="text-gray-500 text-xs">Quick collection</p>
              <p className="text-xl font-bold text-primary mt-1">
                ₹{dailyCollectionSummary.quickCollection.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Overall totals */}
        <div className={`${card} grid grid-cols-5 items-center text-center`}>
          <div>
            <p className="text-gray-400 text-sm">Total</p>
            <p className="font-semibold text-lg mt-1">{overall.total}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Paid</p>
            <p className="font-semibold text-lg mt-1">{overall.paid}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="font-semibold text-lg mt-1">{overall.pending}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Balance</p>
            <p className="font-semibold text-lg mt-1">{overall.balance}</p>
          </div>
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-semibold">
              {overall.percent}%
            </div>
          </div>
        </div>

        {/* Stat card grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className={card}>
            <p className="text-gray-400 text-sm">Active loans</p>
            <p className="text-xl font-bold text-primary mt-1">{activeLoans}</p>
          </div>
          <div className={card}>
            <p className="text-gray-400 text-sm">Overdue loans</p>
            <p className="text-xl font-bold text-primary mt-1">{overdueLoansCount}</p>
          </div>
          <div className={card}>
            <p className="text-gray-400 text-sm">Collected this week</p>
            <p className="text-xl font-bold text-primary mt-1">
              ₹{collectedThisWeek.toLocaleString("en-IN")}
            </p>
          </div>
          <div className={card}>
            <p className="text-gray-400 text-sm">Pending collection</p>
            <p className="text-xl font-bold text-primary mt-1">
              ₹{pendingCollectionAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className={card}>
            <p className="text-gray-400 text-sm">Outstanding</p>
            <p className="text-xl font-bold text-primary mt-1">
              ₹{overall.balance.toLocaleString("en-IN")}
            </p>
          </div>
          <div className={card}>
            <p className="text-gray-400 text-sm">Top balance</p>
            <p className="text-xl font-bold text-primary mt-1">{topBalanceBorrower || "—"}</p>
          </div>
        </div>

        {/* Collection type sections */}
        {[
          { label: "Daily Collections", summary: dailySummary },
          { label: "Weekly Collections", summary: weeklySummary },
          { label: "Monthly Collections", summary: monthlySummary },
        ].map(({ label, summary }) => (
          <div key={label} className={card}>
            <div className="flex items-center justify-between">
              <h3 className="text-primary font-bold text-lg">{label}</h3>
              <span className="text-gray-400 text-sm">{summary.count} loans</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 mt-4 overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${summary.percent}%` }}
              />
            </div>
            <p className="text-gray-500 text-sm mt-3">
              ₹{summary.paid.toLocaleString("en-IN")} collected of ₹
              {summary.total.toLocaleString("en-IN")}
            </p>
          </div>
        ))}

      </main>

      <BottomNav />
    </div>
  );
}
