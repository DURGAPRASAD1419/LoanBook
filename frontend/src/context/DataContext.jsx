import { createContext, useContext, useState, useEffect } from "react";
import {
  fetchBorrowers,
  fetchLoans,
  createBorrower,
  createLoan,
  updateLoan as apiUpdateLoan,
  payLoanDue,
  rescheduleDue as apiRescheduleDue,
  updateBorrower as apiUpdateBorrower,
  deleteBorrower as apiDeleteBorrower,
  deleteLoan as apiDeleteLoan,
} from "../api";

const DataContext = createContext(null);

export function getEffectiveInstallment(loan) {
  const stored = Number(loan?.loanPerInstallment);
  if (Number.isFinite(stored) && stored > 0) return stored;

  const principal = Number(loan?.loanAmount) || 0;
  const interestRate = Number(loan?.interest) || 0;
  const installments = Number(loan?.installment) || 1;

  if (principal <= 0) return 0;

  const totalWithInterest = principal + principal * (interestRate / 100);
  return Math.round(totalWithInterest / installments);
}

function getEffectiveDueAmount(loan, due) {
  const stored = Number(due?.dueAmount);
  if (Number.isFinite(stored) && stored > 0) return stored;

  return getEffectiveInstallment(loan);
}

function normalizeLoan(loan) {
  const effectiveInstallment = getEffectiveInstallment(loan);

  return {
    ...loan,
    id: loan.loanId,
    loanPerInstallment: effectiveInstallment,
    dues: (loan.dues || []).map((due) => ({
      ...due,
      dueAmount: getEffectiveDueAmount(loan, due),
      paidAmount: Number(due.paidAmount) || 0,
    })),
  };
}

export function DataProvider({ children }) {
  const [borrowers, setBorrowers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [borrowersData, loansData] = await Promise.all([fetchBorrowers(), fetchLoans()]);
        setBorrowers(borrowersData);
        setLoans(loansData.map(normalizeLoan));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function addBorrower(borrower) {
    const created = await createBorrower(borrower);
    setBorrowers((prev) => [...prev, created]);
    return created;
  }

  async function updateBorrower(borrowerId, patch) {
    const updated = await apiUpdateBorrower(borrowerId, patch);
    setBorrowers((prev) => prev.map((b) => (b.id === borrowerId ? updated : b)));
    return updated;
  }

  async function deleteBorrower(borrowerId) {
    // call backend to delete borrower and related loans
    await apiDeleteBorrower(borrowerId);
    setBorrowers((prev) => prev.filter((b) => b.id !== borrowerId));
    setLoans((prev) => prev.filter((l) => l.borrowerId !== borrowerId));
  }

  async function addLoan(loan) {
    const created = await createLoan(loan);
    setLoans((prev) => [...prev, normalizeLoan(created)]);
    return normalizeLoan(created);
  }

  async function updateLoan(loanId, patch) {
    const updated = await apiUpdateLoan(loanId, patch);
    setLoans((prev) => prev.map((loan) => (loan.id === loanId ? normalizeLoan(updated) : loan)));
    return normalizeLoan(updated);
  }

  async function payDue(loanId, dueNo, payment) {
    const updated = await payLoanDue(loanId, {
      dueNo,
      paidDate: payment.paidDate,
      collectedBy: payment.collectedBy,
    });
    setLoans((prev) => prev.map((loan) => (loan.id === updated.loanId ? normalizeLoan(updated) : loan)));
    return normalizeLoan(updated);
  }

  async function rescheduleDue(loanId, dueNo, payload) {
    const updated = await apiRescheduleDue(loanId, dueNo, payload);
    setLoans((prev) => prev.map((loan) => (loan.id === updated.loanId ? normalizeLoan(updated) : loan)));
    return normalizeLoan(updated);
  }

  async function deleteLoan(loanId) {
    await apiDeleteLoan(loanId);
    setLoans((prev) => prev.filter((loan) => loan.id !== loanId));
  }

  function loanStats(loan) {
    console.log("Loan:", loan);
    const principal = Number(loan.loanAmount) || 0;
    const interestRate = Number(loan.interest) || 0;
    const effectiveInstallment = getEffectiveInstallment(loan);
    const total = principal > 0 ? principal + principal * (interestRate / 100) : 0;
    const paid = loan.dues.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    const pendingDue = loan.dues.find((d) => !d.paid);
    const pending = pendingDue ? getEffectiveDueAmount(loan, pendingDue) : 0;
    const balance = Math.max(total - paid, 0);
    const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { total, paid, pending, balance, percent, effectiveInstallment };
  }

  return (
    <DataContext.Provider
      value={{
        borrowers,
        loans,
        loading,
        error,
        addBorrower,
        updateBorrower,
        deleteBorrower,
        addLoan,
        updateLoan,
        payDue,
        rescheduleDue,
        deleteLoan,
        loanStats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
