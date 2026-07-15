import { useState } from "react";
import api from "../services/api";
import { FileText, Download, Calendar, BarChart3, AlertTriangle } from "lucide-react";

export default function Reports() {
  const [type, setType] = useState("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const generatePreview = async () => {
    try {
      setLoading(true);
      setError("");
      setReport(null);

      const res = await api.get(`/reports/preview?type=${type}&date=${date}`);
      setReport(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de génération du rapport");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "low":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Rapports</h1>
        <p className="text-slate-500 mt-1">
          Générer et afficher le rapport directement dans la page.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-slate-800">Générer un rapport</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type de rapport
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="daily">Quotidien</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Calendar className="w-5 h-5 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={generatePreview}
            disabled={loading}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium px-4 py-3 transition"
          >
            {loading ? "Chargement..." : "Afficher le rapport"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {report && (
        <div className="space-y-6">
          {/* Meta */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Rapport Smart Campus</h3>
            <div className="text-slate-600 space-y-1">
              <p>
                <span className="font-semibold">Type :</span>{" "}
                {report.meta.type === "monthly" ? "Mensuel" : "Quotidien"}
              </p>
              <p>
                <span className="font-semibold">Date :</span> {report.meta.date}
              </p>
              <p>
                <span className="font-semibold">Généré le :</span>{" "}
                {new Date(report.meta.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Lectures capteurs</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {report.summary.sensorCount}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Alertes</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {report.summary.alertCount}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Température moyenne</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {report.summary.avgTemperature}°C
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Humidité moyenne</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {report.summary.avgHumidity}%
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Taux d’occupation</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {report.summary.occupancyRate}%
              </p>
            </div>
          </div>

          {/* Sensors */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-semibold text-slate-800">
                Dernières lectures capteurs
              </h3>
            </div>

            {report.sensors.length === 0 ? (
              <p className="text-slate-500">Aucune donnée capteur pour cette période.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-200">
                      <th className="py-3 pr-4">Salle</th>
                      <th className="py-3 pr-4">Température</th>
                      <th className="py-3 pr-4">Humidité</th>
                      <th className="py-3 pr-4">Lumière</th>
                      <th className="py-3 pr-4">Présence</th>
                      <th className="py-3 pr-4">Horodatage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sensors.map((sensor) => (
                      <tr key={sensor.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-medium text-slate-700">{sensor.room}</td>
                        <td className="py-3 pr-4">{sensor.temperature}°C</td>
                        <td className="py-3 pr-4">{sensor.humidity}%</td>
                        <td className="py-3 pr-4">{sensor.light}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sensor.presence
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {sensor.presence ? "Oui" : "Non"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">
                          {sensor.timestamp
                            ? new Date(sensor.timestamp).toLocaleString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-xl font-semibold text-slate-800">Alertes</h3>
            </div>

            {report.alerts.length === 0 ? (
              <p className="text-slate-500">Aucune alerte pour cette période.</p>
            ) : (
              <div className="space-y-4">
                {report.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-slate-200 p-4 bg-slate-50"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{alert.title}</h4>
                        <p className="text-slate-600 text-sm mt-1">{alert.message}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {alert.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {alert.room}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-3">
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}