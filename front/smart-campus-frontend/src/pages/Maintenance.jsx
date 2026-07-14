import { useEffect, useState } from "react";
import api from "../services/api";
import { Wrench, Battery, Wifi, Cpu } from "lucide-react";

export default function Maintenance() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/maintenance")
      .then((res) => setItems(Array.isArray(res.data.data) ? res.data.data : []))
      .catch((err) => setError(err.response?.data?.message || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Maintenance</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Wrench size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aucune donnée de maintenance</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div key={item.deviceId || index} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg"><Cpu size={18} className="text-purple-600" /></div>
                <h3 className="font-semibold text-gray-800 text-sm">{item.cardName || item.deviceId || "Appareil inconnu"}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between"><span className="flex items-center gap-1"><Battery size={14} />Batterie</span><span className="font-medium">{item.battery ?? "N/A"}%</span></div>
                <div className="flex items-center justify-between"><span>Santé</span><span className="font-medium">{item.health || "N/A"}</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1"><Wifi size={14} />Signal WiFi</span><span className="font-medium">{item.wifiSignal ?? "N/A"}</span></div>
                <div className="flex items-center justify-between"><span>Firmware</span><span className="font-medium">{item.firmware || "N/A"}</span></div>
                <div className="flex items-center justify-between"><span>Dernière activité</span><span className="font-medium text-xs">{item.lastSeen ? new Date(item.lastSeen).toLocaleString() : "N/A"}</span></div>
              </div>
              {item.recommendation && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">
                  💡 {item.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}