import { useEffect, useState } from "react";
import api from "../services/api";
import { Zap, AlertTriangle } from "lucide-react";

export default function Energy() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get("/energy/rooms").then((res) => setRooms(Array.isArray(res.data.data) ? res.data.data : []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Énergie</h1>

      {rooms.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Zap size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aucune donnée énergétique</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((item, index) => (
            <div key={index} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-yellow-50 rounded-lg"><Zap size={18} className="text-yellow-600" /></div>
                <h3 className="font-semibold text-gray-800 text-sm">{item.room}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Puissance totale</span>
                  <span className="font-medium text-gray-800">{item.totalPower} W</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Événements gaspillage</span>
                  <span className={`font-medium ${item.wasteEvents > 0 ? "text-red-600" : "text-green-600"}`}>
                    {item.wasteEvents > 0 && <AlertTriangle size={12} className="inline mr-1" />}
                    {item.wasteEvents}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}