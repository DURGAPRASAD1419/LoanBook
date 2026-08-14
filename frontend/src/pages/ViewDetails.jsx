import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import EmptyState from "../components/EmptyState";
import { useData, getEffectiveInstallment } from "../context/DataContext";

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

function formatMonthYearLabel(date) {
  return date.toLocaleString("en-IN", { month: "short", year: "numeric" });
}

function toSafeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function buildStatementSummary(paidDues) {
  const monthTotals = new Map();
  const yearTotals = new Map();

  paidDues.forEach((due) => {
    const date = parseDateDMY(due.paidDate);
    if (!date) return;

    const amount = toSafeNumber(due.amount);
    const monthLabel = formatMonthYearLabel(date);
    const existingMonth = monthTotals.get(monthLabel) || { total: 0, ts: date.getTime() };
    existingMonth.total += amount;
    monthTotals.set(monthLabel, existingMonth);

    const year = date.getFullYear();
    yearTotals.set(year, (yearTotals.get(year) || 0) + amount);
  });

  const monthSummary = Array.from(monthTotals.entries())
    .sort((a, b) => b[1].ts - a[1].ts)
    .map(([label, entry]) => ({ label, total: entry.total }));

  const yearSummary = Array.from(yearTotals.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, total]) => ({ year, total }));

  return { monthSummary, yearSummary };
}

export default function ViewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { borrowers, loans, deleteLoan } = useData();

  const borrower = borrowers.find((b) => String(b.id) === String(id));

  const borrowerLoans = loans.filter((l) => String(l.borrowerId) === String(id));

  const handleDeleteLoan = async (event, loanId) => {
    event.stopPropagation();
    if (!deleteLoan) return;

    const ok = window.confirm("Delete this individual loan? This cannot be undone.");
    if (!ok) return;

    try {
      await deleteLoan(loanId);
    } catch (err) {
      alert(err.message || "Unable to delete loan. Try again.");
    }
  };

  const borrowerDues = borrowerLoans.flatMap((loan) =>
    (loan.dues || []).map((due) => ({
      ...due,
      loanId: loan.id,
      loanName: loan.loanId || loan.id,
      loanPurpose: loan.purpose || "Loan",
      dueAmount: Number(due.dueAmount || getEffectiveInstallment(loan) || 0),
      paidAmount: Number(due.paidAmount || 0),
      paid: Boolean(due.paid),
      paidDate: due.paidDate || null,
    }))
  );

  const paidDues = borrowerDues.filter((due) => due.paid && due.paidDate);
  const statementSummary = buildStatementSummary(paidDues);

  const stats = borrowerLoans.reduce(
    (acc, loan) => {
      const taken = toSafeNumber(loan.loanAmount);
      const paid = (loan.dues || [])
        .filter((d) => d.paid)
        .reduce((sum, d) => sum + toSafeNumber(d.paidAmount || d.dueAmount || 0), 0);
      const pending = (loan.dues || [])
        .filter((d) => !d.paid)
        .reduce((sum, d) => sum + toSafeNumber(d.dueAmount || loan.loanPerInstallment || 0), 0);

      acc.totalTaken += taken;
      acc.totalPaid += paid;
      acc.pendingDue += pending;
      acc.outstanding += Math.max(taken - paid, 0);
      return acc;
    },
    { totalTaken: 0, totalPaid: 0, pendingDue: 0, outstanding: 0 }
  );

  // compute count of pending dues and next due date for borrower
  const pendingCount = borrowerLoans.reduce((count, loan) => {
    return (
      count + (loan.dues || []).filter((d) => !d.paid).length
    );
  }, 0);

  const nextDueDate = borrowerLoans
    .flatMap((loan) => loan.dues || [])
    .filter((d) => !d.paid && d.dueDate)
    .map((d) => parseDateDMY(d.dueDate))
    .filter(Boolean)
    .sort((a, b) => a - b)[0] || null;

  const paymentTimeline = borrowerLoans
    .flatMap((loan) =>
      (loan.dues || [])
        .filter((d) => d.paid)
        .map((due) => ({
          loanId: loan.id,
          dueNo: due.dueNo,
          paidDate: due.paidDate || "-",
          amount: Number(due.paidAmount || due.dueAmount || 0),
          collectedBy: due.collectedBy || "Admin",
        }))
    )
    .sort((a, b) => {
      const da = new Date(a.paidDate.split("/").reverse().join("-"));
      const db = new Date(b.paidDate.split("/").reverse().join("-"));
      return db - da;
    });

  if (!borrower) {
    return (
      <div className="app-shell">
        <Header title="Borrower Details" showSearch />
        <main className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 bg-gray-50">
          <EmptyState />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header title="Borrower Details" showSearch />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 bg-gray-50">
        {/* Profile + info card */}
        <div className="rounded-2xl bg-white shadow-md p-4 border-none card-3d">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">{borrower.name}</p>
              <p className="text-base text-gray-500 whitespace-normal break-words">{borrower.shopWork}</p>
            </div>
            <button
              onClick={() => navigate(`/borrowers/${id}/edit`)}
              className="btn-primary rounded-full px-5 py-2 text-sm font-semibold"
            >
              Edit borrower
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white shadow-md px-4 py-3 border-none">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Mobile
              </p>
              <p className="mt-1 text-base font-bold text-gray-900">
                {borrower.mobile || "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-white shadow-md px-4 py-3 border-none">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Alternate Mobile
              </p>
              <p className="mt-1 text-base font-bold text-gray-900">
                {borrower.altMobile || "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-white shadow-md px-4 py-3 border-none">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Father Name
              </p>
              <p className="mt-1 text-base font-bold text-gray-900">
                {borrower.fatherName || "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-white shadow-md px-4 py-3 border-none">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Address
              </p>
              <p className="mt-1 text-base font-bold text-gray-900 whitespace-normal break-words">
                {borrower.address || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl bg-white shadow-md px-4 py-3 text-center border-none">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total Taken
            </p>
            <p className="mt-2 text-lg font-bold text-gray-900">
              ₹{stats.totalTaken.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl bg-white shadow-md px-4 py-4 text-center border-none">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total Paid
            </p>
            <p className="mt-2 text-lg font-bold text-gray-900">
              ₹{stats.totalPaid.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl bg-white shadow-md px-4 py-4 text-center border-none">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Pending Due
            </p>
            <p className="mt-2 text-lg font-bold text-gray-900">
              ₹{stats.pendingDue.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl bg-white shadow-md px-4 py-4 text-center border-none">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Outstanding
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900 break-words">
              ₹{stats.outstanding.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white shadow-md p-3 border-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-bold text-gray-900">Statement summary</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
              <span className="text-xs text-gray-500">
                Total received ₹{stats.totalPaid.toLocaleString("en-IN")}
              </span>
              <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                {pendingCount} pending
              </span>
              <div className="flex min-w-0 items-center gap-1">
                <span className="shrink-0 text-gray-400">Next due:</span>
                {nextDueDate ? (
                  <span className={`inline-block rounded px-2 py-1 font-semibold ${new Date() > nextDueDate ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
                    {formatDateDMY(nextDueDate.toLocaleDateString("en-GB"))}
                  </span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white shadow-md p-4 border-none">
              <h4 className="text-xs font-semibold text-gray-700">By month</h4>
              {statementSummary.monthSummary.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No cleared payments yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {statementSummary.monthSummary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white shadow-md px-3 py-3 border-none">
                      <span className="text-xs text-gray-700">{item.label}</span>
                      <span className="text-xs font-semibold text-gray-900">₹{item.total.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-white shadow-md p-4 border-none">
              <h4 className="text-xs font-semibold text-gray-700">By year</h4>
              {statementSummary.yearSummary.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No cleared payments yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {statementSummary.yearSummary.map((item) => (
                    <div key={item.year} className="flex items-center justify-between rounded-2xl bg-white shadow-md px-3 py-3 border-none">
                      <span className="text-xs text-gray-700">{item.year}</span>
                      <span className="text-xs font-semibold text-gray-900">₹{item.total.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Loans list for this borrower (continues below the fold in the screenshot) */}
        {borrowerLoans.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {borrowerLoans.map((loan) => {
              const next = loan.dues.find((d) => !d.paid) || loan.dues[0];
              const effectiveDueAmount = getEffectiveInstallment(loan);
              return (
                <div
                  key={loan.id}
                  className="rounded-2xl bg-white shadow-md p-4 border-none"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/loan/${loan.id}`)}
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left hover:border-blue-300"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-gray-900">{loan.id}</p>
                          <p className="text-xs text-gray-500">
                            Due {next?.dueNo || "-"} • {next ? next.dueDate : "-"}
                          </p>
                        </div>
                        <span className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white">
                          ₹{effectiveDueAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={(event) => handleDeleteLoan(event, loan.id)}
                      className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}