import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { createBackup } from "../api";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleCreateBackup() {
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const backup = await createBackup();
      const filename = `loanbook-backup-${new Date(backup.createdAt).toISOString().replace(/[:.]/g, "-")}.json`;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus(`Backup created and downloaded: ${filename}`);
    } catch (err) {
      setError(err.message || "Unable to create backup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Header title="Settings" showBack />

      <main className="flex-1 px-4 py-5 space-y-4 bg-gray-50">
        <div className="rounded-2xl bg-white shadow-md p-4 border-none">
          <p className="text-gray-400 text-xs">Logged in as</p>
          <p className="font-semibold text-lg">{user?.username}</p>
        </div>

        <section className="rounded-2xl bg-white shadow-md p-4 space-y-4 border-none">
          <h2 className="text-lg font-semibold text-gray-900">Backup & Restore</h2>
          <p className="text-sm text-gray-500">Create a database-only backup payload and download it directly from your browser. No backup files are stored on the server.</p>
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-60"
          >
            {loading ? "Creating backup…" : "Create Backup"}
          </button>
          {status && <p className="text-sm text-green-700">{status}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}
        </section>

        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-200 bg-white py-3.5 font-medium text-red-500 shadow-sm"
        >
          LOG OUT
        </button>
      </main>
    </div>
  );
}
