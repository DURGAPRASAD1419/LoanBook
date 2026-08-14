import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IndianRupee, User, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (result.ok) {
      navigate("/");
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
          <IndianRupee size={30} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-4xl font-extrabold text-primary-dark">LoanBook</h1>
        <p className="text-gray-500 mt-2 mb-8">Collections, borrowers and reports in one place.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-[15px] text-gray-800 mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl px-4 py-3.5 pr-11 text-[16px] text-gray-900 bg-white shadow-sm"
                autoFocus
              />
              <User size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-[15px] text-gray-800 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl px-4 py-3.5 pr-11 text-[16px] text-gray-900 bg-white shadow-sm"
              />
              <Lock size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm -mt-3">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-white rounded-2xl py-4 font-bold tracking-wide text-[15px] mt-1 shadow-md active:bg-primary-dark"
          >
            LOGIN
          </button>

          <p className="text-center text-gray-500 text-sm">
            Don't have an account? <Link to="/signup" className="text-primary font-semibold">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
