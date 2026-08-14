const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function handleResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return body;
}

function getToken() {
  return localStorage.getItem("loanbook_token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchBorrowers() {
  const response = await fetch(`${API_BASE}/api/borrowers`, { headers: { ...authHeaders() } });
  return handleResponse(response);
}

export async function createBorrower(payload) {
  const response = await fetch(`${API_BASE}/api/borrowers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateBorrower(borrowerId, payload) {
  const response = await fetch(`${API_BASE}/api/borrowers/${borrowerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteBorrower(borrowerId) {
  const response = await fetch(`${API_BASE}/api/borrowers/${borrowerId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse(response);
}

export async function fetchLoans() {
  const response = await fetch(`${API_BASE}/api/loans`, { headers: { ...authHeaders() } });
  return handleResponse(response);
}

export async function createLoan(payload) {
  const response = await fetch(`${API_BASE}/api/loans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateLoan(loanId, payload) {
  const response = await fetch(`${API_BASE}/api/loans/${loanId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteLoan(loanId) {
  const response = await fetch(`${API_BASE}/api/loans/${loanId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse(response);
}

export async function createBackup() {
  const response = await fetch(`${API_BASE}/api/backup`, { method: "POST", headers: { ...authHeaders() } });
  return handleResponse(response);
}

export async function exportLoansJson() {
  const response = await fetch(`${API_BASE}/api/loans/export`, { headers: { ...authHeaders() } });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Failed to export loans.`);
  }
  return response.blob();
}

export async function payLoanDue(loanId, payload) {
  const response = await fetch(`${API_BASE}/api/loans/${loanId}/pay`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function rescheduleDue(loanId, dueNo, payload) {
  const response = await fetch(`${API_BASE}/api/loans/${loanId}/due/${dueNo}/reschedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// Auth endpoints
export async function registerUser(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
}

export async function checkUsername(username) {
  const response = await fetch(`${API_BASE}/api/auth/check-username?username=${encodeURIComponent(username)}`);
  return handleResponse(response);
}

export async function loginUser(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
}
