import { useState } from "react";
import api from "../services/api";
import { TrendingUp, Loader2 } from "lucide-react";

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
      setError(err.response?.data?.message || "Erreur de prédiction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Prédiction</h1>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
            <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Ex: Library" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-800 hover:bg-blue-900 text-white py-2.5 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            {loading ? "Calcul..." : "Prédire"}
          </button>
        </form>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {result && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-600" /> Résultat de la prédiction</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Salle</p><p className="font-bold text-gray-800 mt-1">{result.room}</p></div>
            <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Date</p><p className="font-bold text-gray-800 mt-1">{result.date}</p></div>
            <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500">Occupation prévue</p><p className="font-bold text-blue-700 mt-1">{result.expectedOccupancy}%</p></div>
            <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-xs text-gray-500">Confiance</p><p className="font-bold text-green-700 mt-1">{result.confidence}%</p></div>
          </div>
        </div>
      )}
    </div>
  );
}