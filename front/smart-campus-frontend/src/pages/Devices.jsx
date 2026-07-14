import { useEffect, useState } from "react";
import api from "../services/api";
import { Cpu, Plus, Power, Wifi, Battery, MapPin } from "lucide-react";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    deviceId: "", cardName: "", cardType: "esp32",
    room: "", floor: 1, thingSpeakChannelId: "", thingSpeakApiKey: "",
  });

  const loadDevices = async () => {
    const res = await api.get("/devices");
    setDevices(Array.isArray(res.data.data) ? res.data.data : []);
  };

  useEffect(() => { loadDevices(); }, []);

  const createDevice = async (e) => {
    e.preventDefault();
    await api.post("/devices", form);
    setForm({ deviceId: "", cardName: "", cardType: "esp32", room: "", floor: 1, thingSpeakChannelId: "", thingSpeakApiKey: "" });
    setShowForm(false);
    loadDevices();
  };

  const toggleLed = async (id, current) => {
    await api.put(`/devices/${id}/led`, {
      on: !current.on, color: !current.on ? "green" : "off", brightness: !current.on ? 255 : 0,
    });
    loadDevices();
  };

  const statusColor = { online: "bg-green-100 text-green-700", offline: "bg-red-100 text-red-700", maintenance: "bg-yellow-100 text-yellow-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Appareils</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Add Device Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Nouvel appareil</h3>
          <form onSubmit={createDevice} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Device ID" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} required />
            <input className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nom de la carte" value={form.cardName} onChange={(e) => setForm({ ...form, cardName: e.target.value })} required />
            <input className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Salle" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} required />
            <input className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Étage" type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} />
            <input className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ThingSpeak Channel ID" value={form.thingSpeakChannelId} onChange={(e) => setForm({ ...form, thingSpeakChannelId: e.target.value })} />
            <input className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ThingSpeak API Key" value={form.thingSpeakApiKey} onChange={(e) => setForm({ ...form, thingSpeakApiKey: e.target.value })} />
            <button type="submit" className="sm:col-span-2 lg:col-span-3 bg-blue-800 hover:bg-blue-900 text-white py-2.5 rounded-lg font-medium transition">Créer l'appareil</button>
          </form>
        </div>
      )}

      {/* Device Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div key={device._id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg"><Cpu size={18} className="text-blue-600" /></div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{device.cardName}</h3>
                  <p className="text-xs text-gray-400">{device.deviceId}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[device.status] || statusColor.offline}`}>
                {device.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{device.room} — Étage {device.floor}</div>
              <div className="flex items-center gap-2"><Battery size={14} className="text-gray-400" />{device.battery}%</div>
              <div className="flex items-center gap-2"><Wifi size={14} className="text-gray-400" />Signal: {device.wifiSignal || 0} dBm</div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">LED: {device.ledStatus?.on ? "🟢 ON" : "⚫ OFF"}</span>
              <button onClick={() => toggleLed(device._id, device.ledStatus)} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition">
                <Power size={12} className="inline mr-1" />Toggle LED
              </button>
            </div>
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Cpu size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aucun appareil trouvé</p>
        </div>
      )}
    </div>
  );
}