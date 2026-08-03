# LoanBook Frontend

A React + Vite clone of the LoanBook mobile UI (login, dashboard, collections, loans, borrowers, graphs).

## Stack
- React 19 + Vite
- React Router (client-side routing)
- Tailwind CSS (styling)
- lucide-react (icons)
- recharts (graphs)

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (e.g. http://localhost:5173). The app is built mobile-first — resize your
browser to a phone width (or use dev tools device mode) for the closest match to the reference design.

## Login
This is a UI-only build with no backend yet. On the login screen, enter **any non-empty username and
password** to sign in. Swap the logic in `src/context/AuthContext.jsx` (`login` function) for a real
API call once your backend is ready.

## Data
All borrower/loan data is mock data stored in the browser via `localStorage` (see
`src/context/DataContext.jsx`). Add a borrower first, then add a loan against them, then open the loan
to record payments (dues) and see the payment-success confirmation modal.

## Structure
```
src/
  context/       AuthContext, DataContext (mock state + localStorage)
  components/    Header, BottomNav, EmptyState, FormField, PaymentModal, PaymentSuccessModal, ProtectedRoute
  pages/         Login, Dashboard, Collection, Loan, AddLoan, LoanTransactions, Borrowers, AddBorrower, Graphs, Settings
```

## Next steps when a backend is ready
- Replace `AuthContext.login` with a real auth API call (store a token instead of a fake user object).
- Replace the mock `addBorrower` / `addLoan` / `payDue` functions in `DataContext` with API calls, and
  load `borrowers` / `loans` from the server on mount instead of `localStorage`.
