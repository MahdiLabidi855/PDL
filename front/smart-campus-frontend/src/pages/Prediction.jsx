import { useState } from "react";
import api from "../services/api";

export default function Prediction() {
  const [room, setRoom] = useState("Library");
  const [date, setDate] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.get(`/prediction?room=${encodeURIComponent(room)}&date=${encodeURIComponent(date)}`);
      setResult(res.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Prediction</h1>

      <div className="card" style={{ marginBottom: "20px" }}>
        <form onSubmit={handlePredict} className="grid grid-2">
          <div className="form-group">
            <label>Room</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Example: Library"
              required
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Predicting..." : "Get Prediction"}
          </button>
        </form>
      </div>

      {error && <div className="error-box">{error}</div>}

      {result && (
        <div className="card">
          <h3>Prediction Result</h3>
          <p><strong>Room:</strong> {result.room}</p>
          <p><strong>Date:</strong> {result.date}</p>
          <p><strong>Time:</strong> {result.time}</p>
          <p><strong>Expected Occupancy:</strong> {result.expectedOccupancy}%</p>
          <p><strong>Confidence:</strong> {result.confidence}%</p>
        </div>
      )}
    </div>
  );
}