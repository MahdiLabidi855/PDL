import { useEffect, useState } from "react";
import api from "../services/api";

export default function CampusMap() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMap = async () => {
    try {
      setError("");
      const res = await api.get("/map");
      setRooms(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load campus map");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMap();
  }, []);

  const getRoomColor = (occupancy) => {
    if (occupancy >= 80) return "#ef4444";
    if (occupancy >= 50) return "#eab308";
    return "#22c55e";
  };

  if (loading) return <div className="container"><div className="card">Loading campus map...</div></div>;

  return (
    <div className="container">
      <h1 className="page-title">Campus Map</h1>

      {error && <div className="error-box">{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <h3>Rooms Overview</h3>

          <div
            style={{
              position: "relative",
              width: "100%",
              minHeight: "500px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {rooms.map((room, index) => (
              <div
                key={room.room || index}
                onClick={() => setSelectedRoom(room)}
                style={{
                  position: "absolute",
                  left: `${room.x || 20}px`,
                  top: `${room.y || 20}px`,
                  width: "100px",
                  height: "70px",
                  background: getRoomColor(room.occupancy || 0),
                  color: "white",
                  borderRadius: "10px",
                  padding: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <strong>{room.room}</strong>
                <span style={{ fontSize: "12px" }}>{room.occupancy || 0}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Room Details</h3>

          {selectedRoom ? (
            <>
              <p><strong>Room:</strong> {selectedRoom.room}</p>
              <p><strong>Floor:</strong> {selectedRoom.floor}</p>
              <p><strong>Capacity:</strong> {selectedRoom.capacity}</p>
              <p><strong>Occupancy:</strong> {selectedRoom.occupancy}%</p>
              <p><strong>Temperature:</strong> {selectedRoom.temperature} °C</p>
              <p><strong>Humidity:</strong> {selectedRoom.humidity}%</p>
              <p><strong>X:</strong> {selectedRoom.x}</p>
              <p><strong>Y:</strong> {selectedRoom.y}</p>
            </>
          ) : (
            <p>Select a room on the map to see details.</p>
          )}
        </div>
      </div>
    </div>
  );
}