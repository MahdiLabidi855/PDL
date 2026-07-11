require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const connectDB = require("../src/config/database");

const User = require("../src/models/User");
const Sensor = require("../src/models/Sensor");
const Device = require("../src/models/Device");
const Alert = require("../src/models/Alert");
const Room = require("../src/models/Room");

let EnergyReading = null;
let Recommendation = null;

try {
  EnergyReading = require("../src/models/EnergyReading");
} catch {}

try {
  Recommendation = require("../src/models/Recommendation");
} catch {}

async function seed() {
  await connectDB();
  console.log("✅ MongoDB connected for seeding");

  // Clear previous demo data
  await Promise.all([
    User.deleteMany({ email: /@smartcampus\.local$/ }),
    Sensor.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } }),
    Device.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } }),
    Alert.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } }),
    Room.deleteMany({ name: { $in: ["A101", "A102", "Library", "Lab-B201"] } }),
    EnergyReading
      ? EnergyReading.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } })
      : Promise.resolve(),
    Recommendation
      ? Recommendation.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } })
      : Promise.resolve(),
  ]);

  // Users
  const adminPassword = await bcrypt.hash("123456", 10);
  const userPassword = await bcrypt.hash("123456", 10);

  await User.insertMany([
    {
      name: "Admin Smart Campus",
      email: "admin@smartcampus.local",
      password: adminPassword,
      role: "admin",
    },
    {
      name: "User Smart Campus",
      email: "user@smartcampus.local",
      password: userPassword,
      role: "user",
    },
  ]);

  // Rooms
  await Room.insertMany([
    {
      name: "A101",
      floor: 1,
      capacity: 40,
      position: { x: 100, y: 120 },
      sensorId: "ESP32-A101",
    },
    {
      name: "A102",
      floor: 1,
      capacity: 35,
      position: { x: 260, y: 120 },
      sensorId: "ESP32-A102",
    },
    {
      name: "Library",
      floor: 1,
      capacity: 120,
      position: { x: 100, y: 260 },
      sensorId: "ESP32-LIB",
    },
    {
      name: "Lab-B201",
      floor: 2,
      capacity: 25,
      position: { x: 260, y: 260 },
      sensorId: "ESP32-B201",
    },
  ]);

  // Devices
  await Device.insertMany([
    {
      deviceId: "ESP32-A101",
      cardName: "Classroom A101",
      cardType: "esp32",
      room: "A101",
      floor: 1,
      type: "ESP32",
      status: "online",
      battery: 82,
      firmware: "1.0.1",
      wifiSignal: -42,
      lastSeen: new Date(),
      thingSpeakChannelId: "2859001",
      thingSpeakApiKey: "TESTKEY_A101",
      thingSpeakFieldMapping: {
        field1: "temperature",
        field2: "humidity",
        field3: "light",
        field4: "presence",
        field5: "battery",
      },
      ledStatus: {
        on: true,
        color: "green",
        brightness: 180,
        lastUpdated: new Date(),
      },
    },
    {
      deviceId: "ESP32-A102",
      cardName: "Classroom A102",
      cardType: "esp32",
      room: "A102",
      floor: 1,
      type: "ESP32",
      status: "online",
      battery: 65,
      firmware: "1.0.0",
      wifiSignal: -50,
      lastSeen: new Date(),
      thingSpeakChannelId: "2859002",
      thingSpeakApiKey: "TESTKEY_A102",
      thingSpeakFieldMapping: {
        field1: "temperature",
        field2: "humidity",
        field3: "light",
        field4: "presence",
        field5: "battery",
      },
      ledStatus: {
        on: false,
        color: "off",
        brightness: 0,
        lastUpdated: new Date(),
      },
    },
    {
      deviceId: "ESP32-LIB",
      cardName: "Library Sensor",
      cardType: "esp32",
      room: "Library",
      floor: 1,
      type: "ESP32",
      status: "online",
      battery: 90,
      firmware: "1.0.2",
      wifiSignal: -38,
      lastSeen: new Date(),
      thingSpeakChannelId: "2859003",
      thingSpeakApiKey: "TESTKEY_LIB",
      thingSpeakFieldMapping: {
        field1: "temperature",
        field2: "humidity",
        field3: "light",
        field4: "presence",
        field5: "battery",
      },
      ledStatus: {
        on: true,
        color: "blue",
        brightness: 220,
        lastUpdated: new Date(),
      },
    },
    {
      deviceId: "ESP32-B201",
      cardName: "Lab B201 Sensor",
      cardType: "esp32",
      room: "Lab-B201",
      floor: 2,
      type: "ESP32",
      status: "offline",
      battery: 18,
      firmware: "1.0.0",
      wifiSignal: -70,
      lastSeen: new Date(Date.now() - 10 * 60 * 1000),
      thingSpeakChannelId: "2859004",
      thingSpeakApiKey: "TESTKEY_B201",
      thingSpeakFieldMapping: {
        field1: "temperature",
        field2: "humidity",
        field3: "light",
        field4: "presence",
        field5: "battery",
      },
      ledStatus: {
        on: true,
        color: "red",
        brightness: 255,
        lastUpdated: new Date(),
      },
    },
  ]);

  // Sensors
  const sensorDocs = [];
  const roomConfigs = {
    A101: { temp: 24, hum: 58, light: 380, battery: 82 },
    A102: { temp: 26, hum: 60, light: 260, battery: 65 },
    Library: { temp: 23, hum: 52, light: 420, battery: 90 },
    "Lab-B201": { temp: 29, hum: 78, light: 620, battery: 18 },
  };

  for (let day = 0; day < 7; day++) {
    for (let hour = 8; hour <= 18; hour++) {
      for (const room of Object.keys(roomConfigs)) {
        const cfg = roomConfigs[room];
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - day);
        timestamp.setHours(hour, 0, 0, 0);

        const isPeak = hour >= 10 && hour <= 14;
        const presence =
          room === "Library"
            ? isPeak
            : room === "A101"
            ? hour >= 9 && hour <= 16
            : room === "A102"
            ? hour >= 11 && hour <= 15
            : false;

        sensorDocs.push({
          room,
          temperature: Number((cfg.temp + (Math.random() * 2 - 1)).toFixed(1)),
          humidity: Number((cfg.hum + (Math.random() * 4 - 2)).toFixed(1)),
          light: Math.round(
            presence ? cfg.light : room === "Lab-B201" ? 650 : Math.max(80, cfg.light - 180)
          ),
          presence,
          battery: cfg.battery,
          timestamp,
          lastSeen: timestamp,
        });
      }
    }
  }

  // Add one anomaly for alerts/recommendations
  sensorDocs.push({
    room: "Lab-B201",
    temperature: 32,
    humidity: 84,
    light: 700,
    presence: false,
    battery: 18,
    timestamp: new Date(),
    lastSeen: new Date(),
  });

  await Sensor.insertMany(sensorDocs);

  // Alerts
  await Alert.insertMany([
    {
      type: "low_battery",
      room: "Lab-B201",
      severity: "critical",
      status: "active",
      message: "Low battery on Lab-B201 device: 18%",
      createdAt: new Date(),
    },
    {
      type: "high_temperature",
      room: "Lab-B201",
      severity: "warning",
      status: "active",
      message: "Temperature too high: 32°C",
      createdAt: new Date(),
    },
    {
      type: "energy_waste",
      room: "Lab-B201",
      severity: "warning",
      status: "active",
      message: "Energy waste detected: lights on without presence",
      createdAt: new Date(),
    },
  ]);

  // Optional recommendations
  if (Recommendation) {
    await Recommendation.insertMany([
      {
        type: "energy",
        room: "Lab-B201",
        message: "Turn off lights in Lab-B201 when no presence is detected.",
        priority: "high",
        status: "active",
        createdAt: new Date(),
      },
      {
        type: "occupancy",
        room: "A102",
        message: "Move overflow sessions to A102 during peak library hours.",
        priority: "medium",
        status: "active",
        createdAt: new Date(),
      },
      {
        type: "maintenance",
        room: "Lab-B201",
        message: "Replace or recharge the battery for Lab-B201 sensor.",
        priority: "high",
        status: "active",
        createdAt: new Date(),
      },
    ]);
  }

  // Optional energy readings
  if (EnergyReading) {
    await EnergyReading.insertMany([
      {
        room: "A101",
        power: 12.5,
        duration: 180,
        timestamp: new Date(),
        isWaste: false,
        wasteReason: "",
      },
      {
        room: "A102",
        power: 10.2,
        duration: 150,
        timestamp: new Date(),
        isWaste: false,
        wasteReason: "",
      },
      {
        room: "Library",
        power: 18.7,
        duration: 300,
        timestamp: new Date(),
        isWaste: false,
        wasteReason: "",
      },
      {
        room: "Lab-B201",
        power: 14.3,
        duration: 240,
        timestamp: new Date(),
        isWaste: true,
        wasteReason: "Lights on with no presence detected",
      },
    ]);
  }

  console.log("✅ Seed completed");
  console.log("Admin login:");
  console.log("  email: admin@smartcampus.local");
  console.log("  password: 123456");
  console.log("User login:");
  console.log("  email: user@smartcampus.local");
  console.log("  password: 123456");

  await mongoose.connection.close();
  console.log("✅ DB connection closed");
}

seed().catch(async (err) => {
  console.error("Your current `seed-db.js` is **corrupted**. The safest fix is:");})