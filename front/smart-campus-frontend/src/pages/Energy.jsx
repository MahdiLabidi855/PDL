import { useEffect, useState } from "react";
import api from "../services/api";

export default function Energy() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get("/energy/rooms").then((res) => setRooms(res.data.data || []));
  }, []);

  return (
    <div className="container">
      <h1>Energy</h1>
      <div className="grid">
        {rooms.map((item, index) => (
          <div key={index} className="card">
            <h3>{item.room}</h3>
            <p>Total Power: {item.totalPower}</p>
            <p>Waste Events: {item.wasteEvents}</p>
          </div>
        ))}
      </div>
    </div>
  );
}