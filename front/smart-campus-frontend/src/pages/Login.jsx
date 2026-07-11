import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [error, setError] = useState("");

 const submit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    if (isLogin) {
      await login(form.email, form.password);
      navigate("/");
    } else {
      await register(form.name, form.email, form.password, form.role);
      alert("Account created. Please login.");
      setIsLogin(true);
    }
  } catch (err) {
    setError(err.response?.data?.message || err.message || "Login failed");
  }
};
  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 80 }}>
      <div className="card">
        <h2>{isLogin ? "Login" : "Register"}</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={submit}>
          {!isLogin && (
            <div className="form-group">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="btn" type="submit">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p style={{ marginTop: 16 }}>
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create account" : "Back to login"}
          </button>
        </p>
      </div>
    </div>
  );
}