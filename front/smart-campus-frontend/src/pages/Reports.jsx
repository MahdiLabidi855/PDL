import { useState } from "react";

export default function Reports() {
  const [type, setType] = useState("daily");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

  const downloadReport = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_ORIGIN}/reports/pdf?type=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${date || "today"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Reports</h1>

      <div className="card">
        <div className="grid grid-2">
          <div className="form-group">
            <label>Report Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button className="btn" onClick={downloadReport} disabled={loading}>
            {loading ? "Downloading..." : "Download PDF Report"}
          </button>
        </div>
      </div>
    </div>
  );
}