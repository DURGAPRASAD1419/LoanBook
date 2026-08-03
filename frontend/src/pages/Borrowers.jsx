import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus, Trash2, Download, Printer } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import EmptyState from "../components/EmptyState";
import { useData } from "../context/DataContext";
import { downloadCSV, openPrintWindow } from "../utils/exportUtils";

function parseDateRangeValue(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function parseDateDMY(dateString) {
  if (!dateString) return null;
  const [d, m, y] = dateString.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function formatDateDMY(dateString) {
  if (!dateString) return "";
  const [d, m, y] = dateString.split("/").map(Number);
  if (!d || !m || !y) return dateString;
  return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
}

function isBorrowerInRange(borrowerLoans, fromDate, toDate) {
  if (!fromDate && !toDate) return true;

  return borrowerLoans.some((loan) => {
    const loanDate = parseDateDMY(loan.startDate || loan.endDate);
    if (!loanDate) return false;
    if (fromDate && loanDate < fromDate) return false;
    if (toDate && loanDate > toDate) return false;
    return true;
  });
}

export default function Borrowers() {
  const { borrowers, loans, deleteBorrower } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeDateAction, setActiveDateAction] = useState(null);
  const [pendingFromDate, setPendingFromDate] = useState("");
  const [pendingToDate, setPendingToDate] = useState("");

  const getBorrowerLoans = (borrowerId) =>
    loans.filter((l) => String(l.borrowerId) === String(borrowerId));

  const getStats = (borrowerLoans) => {
    return borrowerLoans.reduce(
      (acc, loan) => {
        const taken = Number(loan.loanAmount) || 0;
        const paid = (loan.dues || [])
          .filter((d) => d.paid)
          .reduce((sum, d) => sum + (Number(d.paidAmount) || Number(d.dueAmount) || 0), 0);
        acc.taken += taken;
        acc.paid += paid;
        acc.balance += Math.max(taken - paid, 0);
        return acc;
      },
      { taken: 0, paid: 0, balance: 0 }
    );
  };

  const getOverdueCount = (borrowerLoans) => {
    return borrowerLoans.reduce((count, loan) => {
      const overdueCount = (loan.dues || []).filter((d) => {
        if (d.paid) return false;
        if (!d.dueDate) return false;
        const [dd, mm, yy] = d.dueDate.split("/").map(Number);
        const dueDate = new Date(yy, mm - 1, dd);
        return dueDate < new Date();
      }).length;
      return count + overdueCount;
    }, 0);
  };

  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, borrowerId) => {
    e.stopPropagation();
    if (!deleteBorrower) return;
    const ok = window.confirm("Delete this borrower and their loans? This cannot be undone.");
    if (!ok) return;
    try {
      setDeletingId(borrowerId);
      await deleteBorrower(borrowerId);
    } catch (err) {
      alert(err.message || "Unable to delete borrower. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const getFilteredBorrowers = (from, to) => {
    const fromDateVal = parseDateRangeValue(from);
    const toDateVal = parseDateRangeValue(to);
    return borrowers.filter((borrower) =>
      isBorrowerInRange(getBorrowerLoans(borrower.id), fromDateVal, toDateVal)
    );
  };

  // compute pending counts and next due date for each borrower
  const borrowerMeta = (id) => {
    const borrowerLoans = getBorrowerLoans(id);
    let pendingCount = 0;
    let nextDueDate = null;
    for (const loan of borrowerLoans) {
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
    return { pendingCount, nextDueDate };
  };

  const exportBorrowers = (from, to) => {
    const rows = getFilteredBorrowers(from, to).map((borrower) => {
      const borrowerLoans = getBorrowerLoans(borrower.id);
      const stats = getStats(borrowerLoans);
      return {
        Id: borrower.id,
        Name: borrower.name,
        Mobile: borrower.mobile,
        "Shop / Work": borrower.shopWork,
        Address: borrower.address,
        "Total Taken": stats.taken,
        "Total Paid": stats.paid,
        Balance: stats.balance,
        "Overdue Count": getOverdueCount(borrowerLoans),
      };
    });

    downloadCSV("borrowers.csv", rows);
  };

  const printBorrowers = (from, to) => {
    const rowsHtml = getFilteredBorrowers(from, to)
      .map((borrower) => {
        const borrowerLoans = getBorrowerLoans(borrower.id);
        const stats = getStats(borrowerLoans);
        return `<tr>
          <td>${borrower.id}</td>
          <td>${borrower.name}</td>
          <td>${borrower.mobile}</td>
          <td>${borrower.shopWork}</td>
          <td>${borrower.address}</td>
          <td>₹${stats.taken.toLocaleString("en-IN")}</td>
          <td>₹${stats.paid.toLocaleString("en-IN")}</td>
          <td>₹${stats.balance.toLocaleString("en-IN")}</td>
          <td>${getOverdueCount(borrowerLoans)}</td>
        </tr>`;
      })
      .join("");

    openPrintWindow(`
      <h1>Borrower List</h1>
      ${from || to ? `<p>Date range: ${from || "Any"} to ${to || "Any"}</p>` : ""}
      <table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Shop/Work</th>
            <th>Address</th>
            <th>Total Taken</th>
            <th>Total Paid</th>
            <th>Balance</th>
            <th>Overdue</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `, "Borrower List");
  };

  const beginDateAction = (action) => {
    setActiveDateAction(action);
    setPendingFromDate("");
    setPendingToDate("");
  };

  const applyDateAction = () => {
    if (activeDateAction === "export") {
      exportBorrowers(pendingFromDate, pendingToDate);
    } else if (activeDateAction === "print") {
      printBorrowers(pendingFromDate, pendingToDate);
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

  const borrowersSearchPanel = (
    <div className="grid gap-3 sm:grid-cols-1">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500"
      >
        <option value="all">All borrowers</option>
        <option value="overdue">Overdue only</option>
        <option value="active">Active only</option>
      </select>
    </div>
  );

  return (
    <div className="app-shell">
      <Header title="Borrowers" showSearch searchPanel={borrowersSearchPanel} onSearch={setSearch} />

      <main className="flex-1 overflow-y-auto hide-scrollbar relative px-4 py-3 bg-gray-50">
          <div className="mb-3 space-y-2 rounded-2xl bg-white shadow-md p-4 border-none">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => beginDateAction("export")}
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Download size={16} /> Export CSV
              </button>
              <button
                onClick={() => beginDateAction("print")}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
          >
            <option value="all">All borrowers</option>
            <option value="overdue">Overdue only</option>
            <option value="active">Active only</option>
          </select>
        </div>

        {borrowers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {borrowers
              .filter((b) => {
                const keyword = search.trim().toLowerCase();
                if (!keyword) return true;
                return [b.name, b.mobile, b.shopWork, b.address]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase()
                  .includes(keyword);
              })
              .filter((b) => {
                const borrowerLoans = getBorrowerLoans(b.id);
                const overdueCount = getOverdueCount(borrowerLoans);
                if (statusFilter === "all") return true;
                if (statusFilter === "overdue") return overdueCount > 0;
                if (statusFilter === "active") return overdueCount === 0;
                return true;
              })
              .map((b) => {
              const borrowerLoans = getBorrowerLoans(b.id);
              const stats = getStats(borrowerLoans);
              const overdueCount = getOverdueCount(borrowerLoans);
              const initial = b.name?.charAt(0)?.toUpperCase() || "?";
              const meta = borrowerMeta(b.id);

              return (
                <div
                  key={b.id}
                  className="rounded-2xl bg-white shadow-md p-4 border-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
                      {initial}
                    </div>

                    <div className="flex-1">
                      <p className="text-base font-bold text-gray-900">
                        {b.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.mobile} &bull; {b.shopWork}
                      </p>
                    </div>

                    {meta.pendingCount > 0 && (
                      <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-700">
                        {meta.pendingCount} pending
                      </span>
                    )}
                  </div>

                  <div className="mt-3 rounded-2xl bg-white shadow-md px-4 py-3 border-none">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Taken
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          ₹{stats.taken.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Paid
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          ₹{stats.paid.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Balance
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          ₹{stats.balance.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>

                    <div className="mt-2 text-xs">
                      <span className="text-xs text-gray-400">Next due:</span>{" "}
                      {meta.nextDueDate ? (
                        <span className={`ml-2 inline-block rounded px-2 py-1 font-semibold ${ (new Date() > meta.nextDueDate) ? 'text-red-600 bg-red-50' : 'text-blue-700 bg-blue-50' }`}>{formatDateDMY(meta.nextDueDate.toLocaleDateString('en-GB'))}</span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={(e) => handleDelete(e, b.id)}
                      disabled={deletingId === b.id}
                      className={`inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-100 ${
                        deletingId === b.id ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <Trash2 size={16} />
                      {deletingId === b.id ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      onClick={() => navigate(`/borrowers/${b.id}`)}
                      className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                      View details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate("/borrowers/add")}
          className="fixed bottom-20 right-6 bg-blue-700 text-white rounded-full pl-4 pr-5 py-3 flex items-center gap-2 shadow-lg font-semibold"
          style={{ maxWidth: 480 }}
        >
          <Plus size={20} /> ADD BORROWER
        </button>
      </main>

      <BottomNav />
    </div>
  );
}