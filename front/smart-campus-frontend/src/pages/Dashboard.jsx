import { useState, useEffect } from "react";
import api from "../services/api";
import socket from "../services/socket";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { Thermometer, Droplets, Sun, Users, Activity, Battery } from "lucide-react";

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

  const fetchData = async () => {
    try {
      const [live, statistics, occ, peak] = await Promise.all([
        api.get("/dashboard/live"),
        api.get("/dashboard/statistics"),
        api.get("/dashboard/occupancy"),
        api.get("/dashboard/peak-hours"),
      ]);
      setLiveData(live.data.data || []);
      setStats(statistics.data.data || {});
      setOccupancy(occ.data.data || []);
      setPeakHours(peak.data.data || []);
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

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

  const statCards = [
    { label: "Avg Temperature", value: `${stats.avgTemperature || 0}°C`, icon: Thermometer, color: "bg-orange-100 text-orange-600" },
    { label: "Avg Humidity", value: `${stats.avgHumidity || 0}%`, icon: Droplets, color: "bg-blue-100 text-blue-600" },
    { label: "Avg Light", value: `${stats.avgLight || 0} lux`, icon: Sun, color: "bg-yellow-100 text-yellow-600" },
    { label: "Occupancy Rate", value: `${stats.occupancyRate || 0}%`, icon: Users, color: "bg-green-100 text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Room Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Live Room Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveData.map((room) => (
            <div key={room.room} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">{room.room}</h3>
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: room.presence ? COLORS.green + "20" : COLORS.gray + "20",
                    color: room.presence ? COLORS.green : COLORS.gray,
                  }}
                >
                  {room.presence ? "Occupied" : "Empty"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Thermometer size={14} className="text-orange-500" />
                  {room.temperature}°C
                </div>
                <div className="flex items-center gap-1">
                  <Droplets size={14} className="text-blue-500" />
                  {room.humidity}%
                </div>
                <div className="flex items-center gap-1">
                  <Sun size={14} className="text-yellow-500" />
                  {room.light} lux
                </div>
                <div className="flex items-center gap-1">
                  <Battery size={14} className="text-green-500" />
                  {room.battery || "N/A"}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Occupancy by Room</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancy}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="room" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="occupancyRate" fill={COLORS.blue} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="occupancy" stroke={COLORS.purple} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}