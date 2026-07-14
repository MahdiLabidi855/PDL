import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Cpu, Bell, Lightbulb, Zap,
  Wrench, TrendingUp, Map, FileText, LogOut, GraduationCap, Menu, X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/devices", label: "Appareils", icon: Cpu },
  { to: "/alerts", label: "Alertes", icon: Bell },
  { to: "/recommendations", label: "Recommandations", icon: Lightbulb },
  { to: "/energy", label: "Énergie", icon: Zap },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/prediction", label: "Prédiction", icon: TrendingUp },
  { to: "/map", label: "Carte du campus", icon: Map },
  { to: "/reports", label: "Rapports", icon: FileText },
];

export default function Layout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-blue-900 to-indigo-900 text-white
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-5 border-b border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <GraduationCap size={22} className="text-blue-800" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Smart Campus</h2>
              <p className="text-xs text-blue-300 truncate">{user?.email || "Utilisateur"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-blue-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <h1 className="font-semibold text-gray-800">Smart Campus</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}