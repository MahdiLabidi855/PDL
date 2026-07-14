import { useEffect, useState } from "react";
import api from "../services/api";
import { AlertTriangle, CheckCircle, Bell } from "lucide-react";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  const loadAlerts = async () => {
    const res = await api.get("/alerts");
    setAlerts(Array.isArray(res.data.data) ? res.data.data : []);
  };

  useEffect(() => { loadAlerts(); }, []);

  const resolveAlert = async (id) => {
    await api.put(`/alerts/${id}/resolve`);
    loadAlerts();
  };

  const severityStyle = {
    critical: "border-l-red-500 bg-red-50",
    warning: "border-l-yellow-500 bg-yellow-50",
    info: "border-l-blue-500 bg-blue-50",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Alertes</h1>

      {alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aucune alerte en cours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert._id} className={`bg-white border border-gray-100 border-l-4 rounded-xl shadow-sm p-4 sm:p-5 ${severityStyle[alert.severity] || severityStyle.info}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className={alert.severity === "critical" ? "text-red-500 shrink-0 mt-0.5" : "text-yellow-500 shrink-0 mt-0.5"} />
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{alert.type}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>Salle: {alert.room}</span>
                      <span>Sévérité: <span className="font-medium">{alert.severity}</span></span>
                      <span>Statut: <span className="font-medium">{alert.status}</span></span>
                    </div>
                  </div>
                </div>
                {alert.status !== "resolved" && (
                  <button onClick={() => resolveAlert(alert._id)} className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0">
                    <CheckCircle size={14} /> Résoudre
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}