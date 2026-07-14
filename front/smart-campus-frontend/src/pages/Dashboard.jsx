  import { useState, useEffect } from "react";
  import api from "../services/api";
  import socket from "../services/socket";
  import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar,
  } from "recharts";
  import { Thermometer, Droplets, Sun, Users, Activity, Battery, Download, X } from "lucide-react";

  const COLORS = {
    green: "#22c55e", yellow: "#eab308", red: "#ef4444", gray: "#6b7280",
    blue: "#3b82f6", purple: "#8b5cf6"
  };

  export default function Dashboard() {
    const [liveData, setLiveData] = useState([]);
    const [stats, setStats] = useState({});
    const [occupancy, setOccupancy] = useState([]);
    const [peakHours, setPeakHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApkBanner, setShowApkBanner] = useState(false);

    useEffect(() => {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const dismissed = localStorage.getItem("apk_banner_dismissed");
      if (isMobile && !dismissed) setShowApkBanner(true);
    }, []);

    const dismissApkBanner = () => {
      setShowApkBanner(false);
      localStorage.setItem("apk_banner_dismissed", "true");
    };

    const fetchData = async () => {
      try {
        const [live, statistics, occ, peak] = await Promise.all([
          api.get("/dashboard/live"),
          api.get("/dashboard/statistics"),
          api.get("/dashboard/occupancy"),
          api.get("/dashboard/peak-hours"),
        ]);
        setLiveData(Array.isArray(live.data.data) ? live.data.data : []);
        setStats(statistics.data.data && typeof statistics.data.data === "object" ? statistics.data.data : {});
        setOccupancy(Array.isArray(occ.data.data) ? occ.data.data : []);
        setPeakHours(Array.isArray(peak.data.data) ? peak.data.data : []);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
      socket.connect();
      socket.on("dashboard:update", fetchData);
      socket.on("sensor:new-reading", (reading) => {
        setLiveData((prev) => {
          const filtered = prev.filter((r) => r.room !== reading.room);
          return [reading, ...filtered];
        });
      });
      return () => {
        socket.off("dashboard:update");
        socket.off("sensor:new-reading");
      };
    }, []);

    if (loading) return <div className="text-center py-12 text-gray-500">Chargement du tableau de bord...</div>;

    const statCards = [
      { label: "Température moy.", value: `${stats.avgTemperature || 0}°C`, icon: Thermometer, color: "bg-orange-50 text-orange-600 border-orange-200" },
      { label: "Humidité moy.", value: `${stats.avgHumidity || 0}%`, icon: Droplets, color: "bg-blue-50 text-blue-600 border-blue-200" },
      { label: "Luminosité moy.", value: `${stats.avgLight || 0} lux`, icon: Sun, color: "bg-yellow-50 text-yellow-600 border-yellow-200" },
      { label: "Taux d'occupation", value: `${stats.occupancyRate || 0}%`, icon: Users, color: "bg-green-50 text-green-600 border-green-200" },
    ];

    return (
      <div className="space-y-6">
        {/* APK Banner */}
        {showApkBanner && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Download size={22} className="shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base">Télécharger l'application Smart Campus</p>
                <p className="text-xs text-blue-100">Profitez de l'expérience native sur votre téléphone</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/smart-campus.apk" download className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-50 transition shrink-0">
                Télécharger APK
              </a>
              <button onClick={dismissApkBanner} className="text-white/70 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tableau de bord</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white border border-gray-100 p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">{card.label}</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1 text-gray-800">{card.value}</p>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-lg border ${card.color}`}>
                  <card.icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Rooms */}
        {liveData.length > 0 && (
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Salles en temps réel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {liveData.map((room) => (
                <div key={room.room} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{room.room}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${room.presence ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {room.presence ? "Occupée" : "Vide"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1"><Thermometer size={14} className="text-orange-500" />{room.temperature}°C</div>
                    <div className="flex items-center gap-1"><Droplets size={14} className="text-blue-500" />{room.humidity}%</div>
                    <div className="flex items-center gap-1"><Sun size={14} className="text-yellow-500" />{room.light} lux</div>
                    <div className="flex items-center gap-1"><Battery size={14} className="text-green-500" />{room.battery || "N/A"}%</div>
                    <div className="flex items-center gap-1 col-span-2">
                      <Activity size={14} className="text-purple-500" />
                      <span className={room.presence ? "text-green-600 font-medium" : "text-gray-400"}>
                        {room.presence ? "Occupied" : "Empty"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {(occupancy.length > 0 || peakHours.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {occupancy.length > 0 && (
              <div className="bg-white border border-gray-100 p-4 sm:p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4 text-sm sm:text-base">Occupation par salle</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={occupancy}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="room" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="occupancy" fill={COLORS.blue} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {peakHours.length > 0 && (
              <div className="bg-white border border-gray-100 p-4 sm:p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4 text-sm sm:text-base">Heures de pointe</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="occupancy" stroke={COLORS.purple} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }