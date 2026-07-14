import { useEffect, useState } from "react";
import api from "../services/api";
import { Lightbulb } from "lucide-react";

export default function Recommendations() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/recommendations").then((res) => setData(Array.isArray(res.data.data) ? res.data.data : []));
  }, []);

  const priorityStyle = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Recommandations</h1>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Lightbulb size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aucune recommandation disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <div key={item._id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg"><Lightbulb size={18} className="text-indigo-600" /></div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityStyle[item.priority] || priorityStyle.low}`}>{item.priority}</span>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.type}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.message}</p>
              <p className="text-xs text-gray-400">Salle: {item.room}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}