import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, extractError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { AlertBanner } from "../../components/ui/index";
import { Button } from "../../components/ui/Button";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState("");
  const [key,      setKey]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !key) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.post("/admin/login", { email, admin_key: key });
      login(res.data.admin);
      navigate("/admin");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center mb-3 shadow-lg">
            <svg width="26" height="26" fill="white" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">
            <span className="text-brand-navy">Suraksha</span>
            <span className="text-brand-teal">Saathi</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Police Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-1">Sign in</h2>
          <p className="text-xs text-gray-400 mb-5">Enter your admin credentials to continue</p>

          {error && <AlertBanner type="error" message={error} className="mb-4" />}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@police.gov.in"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Admin key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal transition-colors"
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={!email || !key}
              className="w-full"
              variant="navy"
            >
              Sign in to Admin Portal
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-50 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-gray-400 hover:text-brand-teal font-medium"
            >
              ← Back to public portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}