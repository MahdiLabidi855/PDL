import { useEffect, useState } from "react";
import api from "../services/api";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  const loadAlerts = async () => {
    const res = await api.get("/alerts");
    setAlerts(res.data.data || []);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const resolveAlert = async (id) => {
    await api.put(`/alerts/${id}/resolve`);
    loadAlerts();
  };

  return (
    <div className="container">
      <h1>Alerts</h1>
      <div className="grid">
        {alerts.map((alert) => (
          <div key={alert._id} className="card">
            <h3>{alert.type}</h3>
            <p>Room: {alert.room}</p>
            <p>Severity: {alert.severity}</p>
            <p>Status: {alert.status}</p>
            <p>{alert.message}</p>
            {alert.status !== "resolved" && (
              <button className="btn" onClick={() => resolveAlert(alert._id)}>
                Resolve
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}