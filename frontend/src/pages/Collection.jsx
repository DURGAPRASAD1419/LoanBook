import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import EmptyState from "../components/EmptyState";
import { useData, getEffectiveInstallment } from "../context/DataContext";
import { useNavigate } from "react-router-dom";
import { downloadCSV, openPrintWindow } from "../utils/exportUtils";

const TABS = ["Daily", "Weekly", "Monthly"];

function parseDateRangeValue(dateString) {
  if (!dateString) return null;
  if (dateString.includes("/")) {
    const [d, m, y] = dateString.split("/").map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  }
  const [y, m, d] = dateString.split("-").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function isLoanInRange(loan, fromDate, toDate) {
  if (!fromDate && !toDate) return true;
  const dateString = loan.startDate || loan.endDate;
  const loanDate = parseDateRangeValue(dateString);
  if (!loanDate) return true;
  if (fromDate && loanDate < fromDate) return false;
  if (toDate && loanDate > toDate) return false;
  return true;
}

function isOverdue(due) {
  if (!due || due.paid || !due.dueDate) return false;
  const [dd, mm, yy] = due.dueDate.split("/").map(Number);
  if (!dd || !mm || !yy) return false;
  const dueDate = new Date(yy, mm - 1, dd);
  return dueDate < new Date();
}

function formatDateDMY(dateString) {
  const [d, m, y] = dateString.split("/").map(Number);
  if (!d || !m || !y) return dateString;
  return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
}

export default function Collection() {
  const [tab, setTab] = useState("Weekly");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeDateAction, setActiveDateAction] = useState(null);
  const [pendingFromDate, setPendingFromDate] = useState("");
  const [pendingToDate, setPendingToDate] = useState("");
  const { loans, loanStats, deleteLoan } = useData();
  const navigate = useNavigate();

  const filtered = useMemo(
    () => loans.filter((l) => l.collectionType === tab),
    [loans, tab]
  );

  const searchFiltered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return filtered;

    return filtered.filter((loan) => {
      const haystack = [loan.borrowerName, loan.id, loan.borrowerId, loan.loanId, loan.collectionType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [filtered, search]);

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return searchFiltered;

    return searchFiltered.filter((loan) => {
      const unpaid = (loan.dues || []).some((due) => !due.paid);
      if (statusFilter === "active") return unpaid;
      if (statusFilter === "paid") return !unpaid;
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

    for (const loan of filteredByStatus) {
      const borrowerKey = String(loan.borrowerId || loan.borrowerName || loan.id);
      if (!groups.has(borrowerKey)) {
        groups.set(borrowerKey, {
          borrowerId: loan.borrowerId || borrowerKey,
          borrowerName: loan.borrowerName || "Unknown borrower",
          loans: [],
          totalDue: 0,
        });
      }

      const group = groups.get(borrowerKey);
      group.loans.push(loan);
      group.totalDue += Number(loan.loanPerInstallment) || getEffectiveInstallment(loan);
    }

    // compute pending counts and next due per borrower group
    const out = Array.from(groups.values()).map((g) => {
      let pendingCount = 0;
      let nextDueDate = null;
      for (const loan of g.loans) {
        for (const due of loan.dues || []) {
          if (!due.paid) {
            pendingCount += 1;
            const [dd, mm, yy] = (due.dueDate || "").split("/").map(Number);
            if (dd && mm && yy) {
              const d = new Date(yy, mm - 1, dd);
              if (!nextDueDate || d.getTime() < nextDueDate.getTime()) nextDueDate = d;
            }
          }
        }
      }
      return {
        ...g,
        pendingCount,
        nextDueDate,
      };
    });

    return out;
  }, [filteredByStatus]);

  const nextDue = useMemo(() => {
    const dueDates = filteredByStatus
      .flatMap((loan) => loan.dues.map((due) => ({ due, loan })))
      .filter(({ due }) => !due.paid)
      .map(({ due }) => {
        const [d, m, y] = due.dueDate.split("/").map(Number);
        return new Date(y, m - 1, d);
      })
      .filter((date) => !Number.isNaN(date.getTime()));

    if (!dueDates.length) return null;
    return new Date(Math.min(...dueDates.map((date) => date.getTime())));
  }, [filteredByStatus]);

  const totalDue = useMemo(
    () =>
      filteredByStatus.reduce((sum, loan) => {
        const effectiveDueAmount = Number(loan.loanPerInstallment) || getEffectiveInstallment(loan);
        return sum + effectiveDueAmount;
      }, 0),
    [filteredByStatus]
  );

  const handleDelete = (e, loanId) => {
    e.stopPropagation();
    if (deleteLoan) deleteLoan(loanId);
  };

  const getFilteredByDate = (from, to) =>
    filteredByStatus.filter((loan) =>
      isLoanInRange(loan, parseDateRangeValue(from), parseDateRangeValue(to))
    );

  const exportCollection = (from, to) => {
    const rows = getFilteredByDate(from, to).map((loan) => ({
      LoanId: loan.loanId || loan.id,
      Borrower: loan.borrowerName,
      CollectionType: loan.collectionType,
      LoanAmount: loan.loanAmount,
      Interest: loan.interest,
      Installment: loan.installment,
      EMI: loan.loanPerInstallment,
      StartDate: loan.startDate,
      EndDate: loan.endDate,
      Balance: loanStats(loan).balance,
      Status: (loan.dues || []).some((due) => !due.paid)
        ? "Active"
        : "Paid",
    }));

    downloadCSV("collection-report.csv", rows);
  };

  const printCollection = (from, to) => {
    const rowsHtml = getFilteredByDate(from, to)
      .map((loan) => {
        const stats = loanStats(loan);
        return `<tr>
          <td>${loan.loanId || loan.id}</td>
          <td>${loan.borrowerName}</td>
          <td>${loan.collectionType}</td>
          <td>₹${Number(loan.loanAmount || 0).toLocaleString("en-IN")}</td>
          <td>${loan.interest || 0}%</td>
          <td>${loan.installment || 0}</td>
          <td>₹${loan.loanPerInstallment || 0}</td>
          <td>${loan.startDate || "-"}</td>
          <td>${loan.endDate || "-"}</td>
          <td>₹${stats.balance.toLocaleString("en-IN")}</td>
          <td>${(loan.dues || []).some((due) => !due.paid) ? "Active" : "Paid"}</td>
        </tr>`;
      })
      .join("");

    openPrintWindow(`
      <h1>Collection Report</h1>
      ${from || to ? `<p>Date range: ${from || "Any"} to ${to || "Any"}</p>` : ""}
      <table>
        <thead>
          <tr>
            <th>Loan Id</th>
            <th>Borrower</th>
            <th>Collection Type</th>
            <th>Loan Amount</th>
            <th>Interest</th>
            <th>Installment</th>
            <th>EMI</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `, "Collection Report");
  };

  const beginDateAction = (action) => {
    setActiveDateAction(action);
    setPendingFromDate("");
    setPendingToDate("");
  };

  const applyDateAction = () => {
    if (activeDateAction === "export") {
      exportCollection(pendingFromDate, pendingToDate);
    } else if (activeDateAction === "print") {
      printCollection(pendingFromDate, pendingToDate);
    }
    setActiveDateAction(null);
    setPendingFromDate("");
    setPendingToDate("");
  };

  const cancelDateAction = () => {
    setActiveDateAction(null);
    setPendingFromDate("");
    setPendingToDate("");
  };

  const collectionSearchPanel = (
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
      <Header title="Collection" showSearch searchPanel={collectionSearchPanel} onSearch={setSearch} />

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

      {/* Due summary row */}
      <section className="px-6 py-4 bg-white shadow-md rounded-2xl border-none flex items-center justify-between mb-4">
        <p className="text-base text-gray-800">
          Due up to{" "}
          <span className={`font-medium ${nextDue && isOverdue({ dueDate: nextDue.toLocaleDateString("en-GB") }) ? "text-red-600" : "text-gray-800"}`}>
            {nextDue ? formatDateDMY(nextDue.toLocaleDateString("en-GB")) : "-"}
          </span>
        </p>
        <p className="text-lg font-bold text-blue-700">
          ₹{totalDue.toLocaleString("en-IN")}
        </p>
      </section>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 bg-gray-50">
        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div />
            <div className="flex flex-wrap items-center gap-2">
              <button
                  onClick={() => beginDateAction("export")}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <Download size={16} /> Export CSV
                </button>
                <button
                  onClick={() => beginDateAction("print")}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
                >
                  <Printer size={16} /> Print
                </button>
              </div>
            </div>

            {activeDateAction && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500">From date</label>
                  <input
                    type="date"
                    value={pendingFromDate}
                    onChange={(e) => setPendingFromDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500">To date</label>
                  <input
                    type="date"
                    value={pendingToDate}
                    onChange={(e) => setPendingToDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={applyDateAction}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Apply & {activeDateAction === "print" ? "Print" : "Export"}
                  </button>
                  <button
                    onClick={cancelDateAction}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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

        {filteredByStatus.length > 0 ? (
          borrowerGroups.map((group) => {
            const firstLoan = group.loans[0];
            const next = firstLoan?.dues.find((d) => !d.paid);
            const overdue = next ? isOverdue(next) : false;
            return (
              <div
                key={group.borrowerId}
                className={`rounded-2xl bg-white shadow-md p-4 border-none cursor-pointer ${overdue ? "bg-red-50" : ""}`}
                onClick={() => navigate(`/borrowers/${group.borrowerId}`)}
              >
                <div>
                  <p className="text-base font-bold text-gray-900">
                    {group.borrowerName}
                  </p>
                        <p className="text-sm text-gray-500">
                          {group.loans.length} loan{group.loans.length > 1 ? "s" : ""}
                          {group.pendingCount > 0 && (
                            <span className="ml-2 inline-flex items-center gap-2 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                              <span className="font-bold">{group.pendingCount}</span> pending
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm">
                          <span className="text-xs text-gray-400">Next due:</span>{" "}
                          {group.nextDueDate ? (
                            <span className={`${isOverdue({ dueDate: group.nextDueDate.toLocaleDateString("en-GB") }) ? "text-red-600 bg-red-50" : "text-blue-700 bg-blue-50"} ml-2 inline-block rounded px-2 py-1 text-sm font-semibold`}>{formatDateDMY(group.nextDueDate.toLocaleDateString("en-GB"))}</span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white">
                    ₹{group.totalDue.toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (firstLoan) handleDelete(e, firstLoan.id);
                    }}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState message="No collection data found." />
        )}
      </main>

      <BottomNav />
    </div>
  );
}