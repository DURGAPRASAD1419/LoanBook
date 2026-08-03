import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Collection from "./pages/Collection";
import Loan from "./pages/Loan";
import AddLoan from "./pages/AddLoan";
import EditLoan from "./pages/EditLoan";
import LoanTransactions from "./pages/LoanTransactions";
import Borrowers from "./pages/Borrowers";
import AddBorrower from "./pages/AddBorrower";
import EditBorrower from "./pages/EditBorrower";
import Graphs from "./pages/Graphs";
import Settings from "./pages/Settings";
import ViewDetails from "./pages/ViewDetails";
import History from "./pages/History";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collection"
              element={
                <ProtectedRoute>
                  <Collection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loan"
              element={
                <ProtectedRoute>
                  <Loan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loan/add"
              element={
                <ProtectedRoute>
                  <AddLoan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loan/:loanId/edit"
              element={
                <ProtectedRoute>
                  <EditLoan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loan/:loanId"
              element={
                <ProtectedRoute>
                  <LoanTransactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/borrowers"
              element={
                <ProtectedRoute>
                  <Borrowers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/borrowers/add"
              element={
                <ProtectedRoute>
                  <AddBorrower />
                </ProtectedRoute>
              }
            />
            <Route
              path="/borrowers/:id/edit"
              element={
                <ProtectedRoute>
                  <EditBorrower />
                </ProtectedRoute>
              }
            />
            <Route
              path="/borrowers/:id"
              element={
                <ProtectedRoute>
                  <ViewDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/graphs"
              element={
                <ProtectedRoute>
                  <Graphs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
