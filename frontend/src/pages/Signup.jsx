import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IndianRupee, User, Lock, Check, X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { checkUsername } from "../api";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [suggested, setSuggested] = useState("");

  const lengthOk = password.length >= 8;
  const upperOk = /[A-Z]/.test(password);
  const numberOk = /[0-9]/.test(password);
  const specialOk = /[^A-Za-z0-9]/.test(password);
  const score = [lengthOk, upperOk, numberOk, specialOk].filter(Boolean).length;
  const strengthPercent = Math.round((score / 4) * 100);
  let strengthLabel = "Weak";
  let strengthColor = "bg-red-400";
  if (score >= 4) {
    strengthLabel = "Strong";
    strengthColor = "bg-green-500";
  } else if (score === 3) {
    strengthLabel = "Good";
    strengthColor = "bg-amber-400";
  } else if (score === 2) {
    strengthLabel = "Fair";
    strengthColor = "bg-orange-400";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Enter username and password.");
      return;
    }
    if (usernameAvailable === false) {
      setError("That username is already taken. Please choose another.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const result = await register(username, password);
    if (result.ok) {
      navigate("/login", { replace: true });
    } else {
      setError(result.message);
    }
  }

  async function handleUsernameBlur() {
    const name = (username || "").trim();
    if (!name) {
      setUsernameAvailable(null);
      setSuggested("");
      return;
    }
    try {
      const res = await checkUsername(name);
      setUsernameAvailable(res.available);
      if (!res.available) {
        // suggest alternatives
        const alt = `${name}${Math.floor(10 + Math.random() * 90)}`;
        setSuggested(alt);
      } else {
        setSuggested("");
      }
    } catch (e) {
      setUsernameAvailable(null);
      setSuggested("");
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
          <IndianRupee size={30} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-4xl font-extrabold text-primary-dark">LoanBook</h1>
        <p className="text-gray-500 mt-2 mb-8">Create an account to access LoanBook.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-[15px] text-gray-800 mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameAvailable(null); setSuggested(""); }}
                onBlur={handleUsernameBlur}
                className="w-full rounded-2xl px-4 py-3.5 pr-11 text-[16px] text-gray-900 bg-white shadow-sm"
                autoFocus
              />
              <User size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="mt-2">
              {usernameAvailable === true && <p className="text-sm text-green-600">Username available</p>}
              {usernameAvailable === false && (
                <div className="text-sm text-red-600">
                  Username taken. Try <button type="button" className="underline" onClick={() => { setUsername(suggested); setUsernameAvailable(true); }}>{suggested}</button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[15px] text-gray-800 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3.5 pr-16 text-[16px] text-gray-900 bg-white shadow-sm"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} className="text-gray-600" /> : <Eye size={18} className="text-gray-600" />}
                  </button>
                </div>
              </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 shadow-sm">
                <span className={lengthOk ? "p-1 rounded-full bg-green-50 text-green-500" : "p-1 rounded-full bg-gray-100 text-gray-300"}>
                  {lengthOk ? <Check size={16} /> : <X size={16} />}
                </span>
                <span className="text-sm text-gray-700">8+ characters</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 shadow-sm">
                <span className={upperOk ? "p-1 rounded-full bg-green-50 text-green-500" : "p-1 rounded-full bg-gray-100 text-gray-300"}>
                  {upperOk ? <Check size={16} /> : <X size={16} />}
                </span>
                <span className="text-sm text-gray-700">Uppercase letter</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 shadow-sm">
                <span className={numberOk ? "p-1 rounded-full bg-green-50 text-green-500" : "p-1 rounded-full bg-gray-100 text-gray-300"}>
                  {numberOk ? <Check size={16} /> : <X size={16} />}
                </span>
                <span className="text-sm text-gray-700">Number</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 shadow-sm">
                <span className={specialOk ? "p-1 rounded-full bg-green-50 text-green-500" : "p-1 rounded-full bg-gray-100 text-gray-300"}>
                  {specialOk ? <Check size={16} /> : <X size={16} />}
                </span>
                <span className="text-sm text-gray-700">Special character</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${strengthPercent}%` }}
                />
              </div>
              <div className="mt-1 text-sm text-gray-600">Password strength: <span className="font-semibold text-gray-800">{strengthLabel}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-[15px] text-gray-800 mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-2xl px-4 py-3.5 pr-20 text-[16px] text-gray-900 bg-white shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {password && confirm && password === confirm ? (
                  <Check size={18} className="text-green-500" />
                ) : (
                  <Lock size={18} className="text-gray-400" />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff size={18} className="text-gray-600" /> : <Eye size={18} className="text-gray-600" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm -mt-3">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-white rounded-2xl py-4 font-bold tracking-wide text-[15px] mt-1 shadow-md active:bg-primary-dark"
          >
            SIGN UP
          </button>

          <p className="text-center text-gray-500 text-sm">
            Already have an account? <Link to="/login" className="text-primary font-semibold">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
