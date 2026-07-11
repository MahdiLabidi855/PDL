import { useEffect, useState } from "react";
import api from "../services/api";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({
    deviceId: "",
    cardName: "",
    cardType: "esp32",
    room: "",
    floor: 1,
    thingSpeakChannelId: "",
    thingSpeakApiKey: "",
  });

  const loadDevices = async () => {
    const res = await api.get("/devices");
    setDevices(res.data.data || []);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const createDevice = async (e) => {
    e.preventDefault();
    await api.post("/devices", form);
    setForm({
      deviceId: "",
      cardName: "",
      cardType: "esp32",
      room: "",
      floor: 1,
      thingSpeakChannelId: "",
      thingSpeakApiKey: "",
    });
    loadDevices();
  };

  const toggleLed = async (id, current) => {
    await api.put(`/devices/${id}/led`, {
      on: !current.on,
      color: !current.on ? "green" : "off",
      brightness: !current.on ? 255 : 0,
    });
    loadDevices();
  };

  return (
    <div className="container">
      <h1>Devices</h1>

      <div className="card">
        <h3>Add Device</h3>
        <form onSubmit={createDevice} className="grid grid-2">
          <input
            placeholder="Device ID"
            value={form.deviceId}
            onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
          />
          <input
            placeholder="Card Name"
            value={form.cardName}
            onChange={(e) => setForm({ ...form, cardName: e.target.value })}
          />
          <input
            placeholder="Room"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
          />
          <input
            placeholder="Floor"
            type="number"
            value={form.floor}
            onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
          />
          <input
            placeholder="ThingSpeak Channel ID"
            value={form.thingSpeakChannelId}
            onChange={(e) =>
              setForm({ ...form, thingSpeakChannelId: e.target.value })
            }
          />
          <input
            placeholder="ThingSpeak API Key"
            value={form.thingSpeakApiKey}
            onChange={(e) =>
              setForm({ ...form, thingSpeakApiKey: e.target.value })
            }
          />
          <button className="btn" type="submit">
            Create Device
          </button>
        </form>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        {devices.map((device) => (
          <div key={device._id} className="card">
            <h3>{device.cardName}</h3>
            <p>Room: {device.room}</p>
            <p>Device ID: {device.deviceId}</p>
            <p>
              Status:{" "}
              <span
                className={
                  device.status === "online" ? "status-online" : "status-offline"
                }
              >
                {device.status}
              </span>
            </p>
            <p>Battery: {device.battery}%</p>
            <p>LED: {device.ledStatus?.on ? "ON" : "OFF"}</p>
            <button
              className="btn-success"
              onClick={() => toggleLed(device._id, device.ledStatus)}
            >
              Toggle LED
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}