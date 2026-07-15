import { useState } from "react";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

export default function Reports() {
  const [type, setType] = useState("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const downloadReport = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const url = `${API_ORIGIN}/reports/pdf?type=${type}&date=${date}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let message = "Échec du téléchargement";
        try {
          const errData = await res.json();
          message = errData.message || message;
        } catch (_) {}
        throw new Error(message);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${type}-report-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err.message || "Échec du téléchargement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Rapports</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold mb-6">Générer un rapport PDF</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type de rapport
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="daily">Quotidien</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <button
            onClick={downloadReport}
            disabled={loading}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium px-4 py-3"
          >
            {loading ? "Téléchargement..." : "Télécharger le rapport"}
          </button>
        </div>
      </div>
    </div>
  );
}