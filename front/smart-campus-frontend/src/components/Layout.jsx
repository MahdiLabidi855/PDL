import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Cpu, Bell, Lightbulb, Zap, Wrench,
  Map, TrendingUp, FileText, LogOut
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/devices", icon: Cpu, label: "Rooms & Devices" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/recommendations", icon: Lightbulb, label: "Recommendations" },
  { to: "/energy", icon: Zap, label: "Energy" },
  { to: "/maintenance", icon: Wrench, label: "Maintenance" },
  { to: "/map", icon: Map, label: "Campus Map" },
  { to: "/prediction", icon: TrendingUp, label: "Prediction" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white min-h-screen hidden md:block">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Smart Campus</h1>
          <p className="text-xs text-gray-400">{user?.name || "User"}</p>
        </div>
        <nav className="p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded mb-1 transition ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-800"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 w-full hover:bg-red-600 transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile header */}
      <div className="flex-1">
        <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center">
          <h1 className="text-lg font-bold">Smart Campus</h1>
          <select
            onChange={(e) => navigate(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded"
          >
            {navItems.map((item) => (
              <option key={item.to} value={item.to}>{item.label}</option>
            ))}
          </select>
        </div>
        <main className="p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}