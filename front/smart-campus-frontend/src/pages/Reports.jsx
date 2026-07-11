import { useState } from "react";

export default function Reports() {
  const [type, setType] = useState("daily");
  const [date, setDate] = useState("");

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/reports/pdf?type=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}`,
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

          <button className="btn" onClick={downloadReport}>
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}