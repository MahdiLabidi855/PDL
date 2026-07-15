import { useEffect, useState } from "react";
import api from "../services/api";
import { Map, MapPin, Thermometer, Droplets } from "lucide-react";

export default function CampusMap() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/map")
      .then((res) => setRooms(Array.isArray(res.data.data) ? res.data.data : []))
      .catch((err) => setError(err.response?.data?.message || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const getRoomColor = (occupancy) => {
    if (occupancy >= 80) return "bg-red-500";
    if (occupancy >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement de la carte...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Carte du campus</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Vue d'ensemble</h3>
            <div className="relative w-full h-[500px] bg-gray-50 border border-gray-200 rounded-xl overflow-auto">
            {rooms.map((room, index) => (
              <div
                key={room.room || index}
                onClick={() => setSelectedRoom(room)}
                className={`absolute ${getRoomColor(room.occupancy || 0)} text-white rounded-lg p-2 cursor-pointer shadow-md hover:scale-105 transition-transform flex flex-col items-center justify-center text-center`}
                style={{ left: `${room.x || 20}px`, top: `${room.y || 20}px`, width: "90px", height: "65px" }}
              >
                <span className="font-semibold text-xs">{room.room}</span>
                <span className="text-[10px] opacity-90">{room.occupancy || 0}%</span>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> &lt;50%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500"></span> 50-80%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> &gt;80%</span>
          </div>
        </div>

        {/* Room Details */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Détails de la salle</h3>
          {selectedRoom ? (
            <div className="space-y-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg mb-4">
                <MapPin size={24} className="mx-auto text-blue-600 mb-1" />
                <p className="font-bold text-gray-800">{selectedRoom.room}</p>
                <p className="text-xs text-gray-500">Étage {selectedRoom.floor}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">Capacité</span><span className="font-medium">{selectedRoom.capacity}</span></div>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">Occupation</span><span className="font-medium">{selectedRoom.occupancy}%</span></div>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-gray-500 flex items-center gap-1"><Thermometer size={14} />Température</span><span className="font-medium">{selectedRoom.temperature}°C</span></div>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-gray-500 flex items-center gap-1"><Droplets size={14} />Humidité</span><span className="font-medium">{selectedRoom.humidity}%</span></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Map size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Cliquez sur une salle pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}