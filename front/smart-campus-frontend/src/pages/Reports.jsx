import { useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";

export default function Reports() {
  const [type, setType] = useState("daily");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

  const downloadReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_ORIGIN}/reports/pdf?type=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Échec du téléchargement");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${date || "today"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "Téléchargement échoué");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Rapports</h1>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-blue-600" />
          <h3 className="font-semibold text-gray-700">Générer un rapport PDF</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de rapport</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="daily">Quotidien</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={downloadReport} disabled={loading} className="bg-blue-800 hover:bg-blue-900 text-white py-2.5 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? "Téléchargement..." : "Télécharger PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}