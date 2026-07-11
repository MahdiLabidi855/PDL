import { useEffect, useState } from "react";
import api from "../services/api";

export default function Recommendations() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/recommendations").then((res) => setData(res.data.data || []));
  }, []);

  return (
    <div className="container">
      <h1>Recommendations</h1>
      <div className="grid">
        {data.map((item) => (
          <div key={item._id} className="card">
            <h3>{item.type}</h3>
            <p>Room: {item.room}</p>
            <p>Priority: {item.priority}</p>
            <p>{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}