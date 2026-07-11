import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <h2>Smart Campus</h2>
        <p style={{ fontSize: "14px", color: "#cbd5e1" }}>
          {user?.email || "Connected user"}
        </p>

        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/devices">Devices</NavLink>
          <NavLink to="/alerts">Alerts</NavLink>
          <NavLink to="/recommendations">Recommendations</NavLink>
          <NavLink to="/energy">Energy</NavLink>
          <NavLink to="/maintenance">Maintenance</NavLink>
          <NavLink to="/prediction">Prediction</NavLink>
          <NavLink to="/map">Campus Map</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <button className="btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}