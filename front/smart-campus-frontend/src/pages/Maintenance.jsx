import { useEffect, useState } from "react";
import api from "../services/api";

export default function Maintenance() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMaintenance = async () => {
    try {
      setError("");
      const res = await api.get("/maintenance");
      setItems(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load maintenance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaintenance();
  }, []);

  if (loading) return <div className="container"><div className="card">Loading maintenance...</div></div>;

  return (
    <div className="container">
      <h1 className="page-title">Maintenance</h1>

      {error && <div className="error-box">{error}</div>}

      <div className="grid grid-2">
        {items.length === 0 ? (
          <div className="card">No maintenance data found.</div>
        ) : (
          items.map((item, index) => (
            <div key={item.deviceId || index} className="card">
              <h3>{item.cardName || item.deviceId || "Unknown Device"}</h3>
              <p><strong>Battery:</strong> {item.battery ?? "N/A"}%</p>
              <p><strong>Health:</strong> {item.health || "N/A"}</p>
              <p><strong>WiFi Signal:</strong> {item.wifiSignal ?? "N/A"}</p>
              <p><strong>Firmware:</strong> {item.firmware || "N/A"}</p>
              <p><strong>Last Seen:</strong> {item.lastSeen ? new Date(item.lastSeen).toLocaleString() : "N/A"}</p>
              <p><strong>Recommendation:</strong> {item.recommendation || "No recommendation"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}