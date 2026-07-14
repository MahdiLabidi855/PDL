import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
        navigate("/");
      } else {
        await register(form.name, form.email, form.password, form.role);
        setSuccess("Account created successfully. Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Institution Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <GraduationCap size={32} className="text-blue-800" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Smart Campus</h1>
          <p className="text-blue-200 mt-1 text-sm sm:text-base">
            IoT Platform — Gestion Intelligente du Campus
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {isLogin ? "Bienvenue sur votre portail" : "Créer un compte"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isLogin
                ? "Veuillez entrer vos identifiants pour vous connecter"
                : "Remplissez les informations ci-dessous"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Votre nom"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant (Email) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="exemple@campus.tn"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="admin">Administrateur</option>
                  <option value="user">Utilisateur</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isLogin ? "Se connecter" : "Créer le compte"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
              className="text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              {isLogin ? "Créer un nouveau compte" : "← Retour à la connexion"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300 text-xs mt-6">
          © 2025 Smart Campus — Plateforme IoT Universitaire
        </p>
      </div>
    </div>
  );
}