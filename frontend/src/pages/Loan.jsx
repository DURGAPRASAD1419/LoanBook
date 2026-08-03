import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import EmptyState from "../components/EmptyState";
import { useData, getEffectiveInstallment } from "../context/DataContext";

const TABS = ["Daily", "Weekly", "Monthly"];

function formatDateDMY(dateString) {
  if (!dateString) return "-";
  const [d, m, y] = dateString.split("/").map(Number);
  if (!d || !m || !y) return dateString;
  return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
}

export default function Loan() {
  const [tab, setTab] = useState("Weekly");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { loans, loanStats, deleteLoan } = useData();
  const navigate = useNavigate();

  const filtered = useMemo(
    () => loans.filter((l) => l.collectionType === tab),
    [loans, tab]
  );

  const searchFiltered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return filtered.filter((loan) => {
      if (!keyword) return true;
      const haystack = [
        loan.borrowerName,
        loan.borrowerId,
        loan.id,
        loan.loanId,
        loan.collectionType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [filtered, search]);

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return searchFiltered;

    return searchFiltered.filter((loan) => {
      const hasUnpaid = (loan.dues || []).some((due) => !due.paid);
      if (statusFilter === "active") return hasUnpaid;
      if (statusFilter === "paid") return !hasUnpaid;
      if (statusFilter === "overdue") {
        return (loan.dues || []).some((due) => {
          if (due.paid || !due.dueDate) return false;
          const [dd, mm, yy] = due.dueDate.split("/").map(Number);
          const dueDate = new Date(yy, mm - 1, dd);
          return dueDate < new Date();
        });
      }
      return true;
    });
  }, [searchFiltered, statusFilter]);

  const borrowerGroups = useMemo(() => {
    const groups = new Map();

    for (const loan of filtered) {
      const borrowerKey = String(loan.borrowerId || loan.borrowerName || loan.id);
      if (!groups.has(borrowerKey)) {
        groups.set(borrowerKey, {
          borrowerId: loan.borrowerId || borrowerKey,
          borrowerName: loan.borrowerName || "Unknown borrower",
          loans: [],
          totalTaken: 0,
          totalDue: 0,
        });
      }

      const group = groups.get(borrowerKey);
      group.loans.push(loan);
      group.totalTaken += Number(loan.loanAmount) || 0;
      group.totalDue += Number(loan.loanPerInstallment) || getEffectiveInstallment(loan);
    }

    return Array.from(groups.values());
  }, [filtered]);

  const loanSearchPanel = (
    <div className="grid gap-3 sm:grid-cols-1">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500"
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="overdue">Overdue</option>
        <option value="paid">Paid</option>
      </select>
    </div>
  );

  return (
    <div className="app-shell">
      <Header title="Loan" showSearch searchPanel={loanSearchPanel} onSearch={setSearch} />

      {/* Radio-style tabs */}
      <section className="px-6 py-4 bg-white shadow-md rounded-2xl border-none mb-4">
        <div className="flex items-start gap-8">
          {TABS.map((item) => (
            <label
              key={item}
              className="flex items-start gap-2 cursor-pointer select-none"
              onClick={() => setTab(item)}
            >
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  tab === item ? "border-blue-700" : "border-gray-300"
                }`}
              >
                {tab === item && (
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-700" />
                )}
              </span>
              <span
                className={`text-base leading-tight ${
                  tab === item
                    ? "text-blue-700 font-semibold"
                    : "text-gray-500 font-medium"
                }`}
              >
                {item} Collections
              </span>
            </label>
          ))}
        </div>
      </section>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 bg-gray-50">
        <div className="mb-4 space-y-3">
          <div />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {filteredByStatus.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {borrowerGroups
              .filter((group) => group.loans.some((loan) => filteredByStatus.some((item) => item.id === loan.id)))
              .map((group) => {
              const firstLoan = group.loans[0];
              const next = firstLoan?.dues.find((d) => !d.paid) || firstLoan?.dues[0];
              const totalLoans = group.loans.length;
              const effectiveDueAmount = group.totalDue;

              return (
                <div
                  key={group.borrowerId}
                  className="rounded-2xl bg-white shadow-md p-4 border-none cursor-pointer"
                  onClick={() => navigate(`/borrowers/${group.borrowerId}`)}
                >
                  <div className="flex gap-4">
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {group.borrowerName}
                          </p>
                          <p className="text-base font-semibold text-gray-500">
                            {totalLoans} loan{totalLoans > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <p className="text-base text-gray-500">{firstLoan?.purpose || "Loan account"}</p>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-base text-gray-700">
                          <span>{formatDateDMY(next?.dueDate)}</span>
                          <span>{next?.dueNo || "-"}</span>
                        </div>
                        <span className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white">
                          Due ₹{effectiveDueAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm text-gray-500">Taken</p>
                      <p className="text-base font-bold text-gray-900">
                        ₹{group.totalTaken.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Loans</p>
                      <p className="text-base font-bold text-gray-900">{totalLoans}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Due</p>
                      <p className="text-base font-bold text-gray-900">
                        ₹{effectiveDueAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              );
              })}
          </div>
        )}

        <button
          onClick={() => navigate("/loan/add")}
          className="fixed bottom-20 right-6 bg-blue-700 text-white rounded-full pl-4 pr-5 py-3 flex items-center gap-2 shadow-lg font-semibold"
          style={{ maxWidth: 480 }}
        >
          <Plus size={20} /> ADD LOAN
        </button>
      </main>

      <BottomNav />
    </div>
  );
}