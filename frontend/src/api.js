const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function handleResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return body;
}

export async function fetchBorrowers() {
  const response = await fetch(`${API_BASE}/api/borrowers`);
  return handleResponse(response);
}

export async function createBorrower(payload) {
  const response = await fetch(`${API_BASE}/api/borrowers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateBorrower(borrowerId, payload) {
  const response = await fetch(`${API_BASE}/api/borrowers/${borrowerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteBorrower(borrowerId) {
  const response = await fetch(`${API_BASE}/api/borrowers/${borrowerId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

export async function fetchLoans() {
  const response = await fetch(`${API_BASE}/api/loans`);
  return handleResponse(response);
}

export async function createLoan(payload) {
  const response = await fetch(`${API_BASE}/api/loans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateLoan(loanId, payload) {
  const response = await fetch(`${API_BASE}/api/loans/${loanId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteLoan(loanId) {
  const response = await fetch(`${API_BASE}/api/loans/${loanId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

export async function createBackup() {
  const response = await fetch(`${API_BASE}/api/backup`, {
    method: "POST",
  });
  return handleResponse(response);
}

export async function exportLoansJson() {
  const response = await fetch(`${API_BASE}/api/loans/export`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Failed to export loans.`);
  }
  return response.blob();
}

export async function payLoanDue(loanId, payload) {
  const response = await fetch(`${API_BASE}/api/loans/${loanId}/pay`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function rescheduleDue(loanId, dueNo, payload) {
  const response = await fetch(`${API_BASE}/api/loans/${loanId}/due/${dueNo}/reschedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
