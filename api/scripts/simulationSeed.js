/**
 * Smart Campus — Simulation Seed Script
 * 
 * Populates ALL collections with realistic demo data:
 *   - 1 admin user
 *   - 10 rooms across 3 floors
 *   - 10 ESP32 devices (8 online, 1 offline, 1 maintenance)
 *   - ~840 sensor readings (7 days, every 2h, 10 rooms)
 *   - 15 alerts (mixed types, severities, read/unread)
 *   - Energy readings (today + this month, with waste events)
 *   - 8 recommendations (energy + occupancy)
 *   - Audit logs
 *
 * Usage:
 *   node src/scripts/simulationSeed.js
 *   # or add to package.json: "seed:sim": "node src/scripts/simulationSeed.js"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const Device = require('../src/models/Device');
const Sensor = require('../src/models/Sensor');
const Alert = require('../src/models/Alert');
const EnergyReading = require('../src/models/EnergyReading');
const Recommendation = require('../src/models/Recommendation');
const Room = require('../src/models/Room');
const AuditLog = require('../src/models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-campus';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const round1 = (n) => Math.round(n * 10) / 10;

// ─── Room Definitions ─────────────────────────────────────────────────────────

const ROOMS = [
  // Floor 1
  { room: 'A101', floor: 1, cardName: 'Classroom A101', capacity: 40, x: 100, y: 200 },
  { room: 'A102', floor: 1, cardName: 'Classroom A102', capacity: 35, x: 250, y: 200 },
  { room: 'A103', floor: 1, cardName: 'Lab A103',       capacity: 25, x: 400, y: 200 },
  // Floor 2
  { room: 'B201', floor: 2, cardName: 'Classroom B201', capacity: 45, x: 100, y: 350 },
  { room: 'B202', floor: 2, cardName: 'Classroom B202', capacity: 40, x: 250, y: 350 },
  { room: 'B203', floor: 2, cardName: 'Meeting Room B203', capacity: 15, x: 400, y: 350 },
  // Floor 3
  { room: 'Library',  floor: 3, cardName: 'Library Hall',     capacity: 80, x: 150, y: 500 },
  { room: 'Lab1',     floor: 3, cardName: 'Computer Lab 1',   capacity: 30, x: 300, y: 500 },
  { room: 'Lab2',     floor: 3, cardName: 'Computer Lab 2',   capacity: 30, x: 450, y: 500 },
  { room: 'Auditorium', floor: 3, cardName: 'Main Auditorium', capacity: 120, x: 250, y: 650 },
];

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('  → Seeding users...');
  const hashed = await bcrypt.hash('123456', 10);
  await User.create([
    { name: 'Admin', email: 'admin@campus.edu', password: hashed, role: 'admin' },
    { name: 'Mahdi Labidi', email: 'mahdi@campus.edu', password: hashed, role: 'admin' },
    { name: 'Sami Trabelsi', email: 'sami@campus.edu', password: hashed, role: 'user' },
  ]);
  console.log('    ✓ 3 users created (admin@campus.edu / 123456)');
}

async function seedRooms() {
  console.log("  → Seeding rooms...");

  const docs = ROOMS.map((r) => ({
    name: r.room,
    floor: r.floor,
    capacity: r.capacity,

    position: {
      x: r.x,
      y: r.y,
    },

    sensorId: `ESP32-${r.room}`,

    occupancy: randInt(0, r.capacity),
    temperature: round1(rand(20, 26)),
    humidity: randInt(40, 65),
  }));

  await Room.insertMany(docs);

  console.log(`    ✓ ${docs.length} rooms created across 3 floors`);
}

async function seedDevices() {
  console.log('  → Seeding devices...');
  const now = new Date();
  const devices = ROOMS.map((r, i) => {
    const status = i === 8 ? 'offline' : i === 2 ? 'maintenance' : 'online';
    return {
      deviceId: `ESP32-${r.room}`,
      cardName: r.cardName,
      cardType: 'esp32',
      room: r.room,
      floor: r.floor,
      status,
      battery: status === 'offline' ? 5 : status === 'maintenance' ? 12 : randInt(55, 95),
      firmware: pick(['1.0.0', '1.1.0', '1.2.0']),
      wifiSignal: status === 'offline' ? -90 : status === 'maintenance' ? -75 : randInt(-65, -35),
      lastSeen: status === 'offline'
        ? new Date(now.getTime() - randInt(3, 12) * 3600000)
        : new Date(now.getTime() - randInt(1, 30) * 60000),
      thingSpeakChannelId: String(2800000 + i * 137),
      thingSpeakApiKey: `XXXXXXXXXX${i}`,
      thingSpeakReadKey: `READKEY${i}XYZ`,
      thingSpeakFieldMapping: {
        field1: 'temperature',
        field2: 'humidity',
        field3: 'light',
        field4: 'presence',
        field5: 'battery',
      },
      ledStatus: {
        on: i % 3 === 0,
        color: i % 3 === 0 ? pick(['green', 'blue', 'red']) : 'off',
        brightness: i % 3 === 0 ? randInt(50, 200) : 0,
        lastUpdated: new Date(now.getTime() - randInt(1, 120) * 60000),
      },
    };
  });
  await Device.insertMany(devices);
  console.log(`    ✓ ${devices.length} devices created (8 online, 1 maintenance, 1 offline)`);
}

async function seedSensors() {
  console.log('  → Seeding sensor readings (7 days, every 2h)...');
  const now = new Date();
  const readings = [];
  const HOURS_BACK = 24 * 7;       // 7 days
  const INTERVAL = 2;               // every 2 hours
  const totalPerRoom = HOURS_BACK / INTERVAL; // 84

  for (const r of ROOMS) {
    // Base values per room — each room has a slightly different profile
    const baseTemp = round1(rand(21, 25));
    const baseHum = randInt(45, 60);
    const baseLight = randInt(200, 400);
    let battery = randInt(70, 95);

    for (let h = 0; h < totalPerRoom; h++) {
      const ts = new Date(now.getTime() - (totalPerRoom - h) * INTERVAL * 3600000);
      const hour = ts.getHours();

      // Simulate daily patterns: warmer midday, cooler at night
      const dayFactor = Math.sin((hour - 6) / 24 * Math.PI * 2) * 0.5 + 0.5; // 0..1
      const isDaytime = hour >= 8 && hour <= 18;

      // Battery slowly drains, recharges occasionally (solar simulation)
      if (h % 12 === 0) battery = Math.min(100, battery + randInt(5, 15));
      battery = Math.max(5, battery - randInt(0, 2));

      readings.push({
        room: r.room,
        temperature: round1(baseTemp + dayFactor * rand(1, 3) + rand(-0.5, 0.5)),
        humidity: Math.round(baseHum - dayFactor * rand(3, 8) + rand(-2, 2)),
        light: isDaytime
          ? Math.round(baseLight + dayFactor * rand(50, 150) + rand(-20, 20))
          : Math.round(rand(5, 30)),
        presence: isDaytime && Math.random() > 0.3,
        battery,
        timestamp: ts,
      });
    }
  }

  await Sensor.insertMany(readings);
  console.log(`    ✓ ${readings.length} sensor readings created (${totalPerRoom} per room × ${ROOMS.length} rooms)`);
}

async function seedAlerts() {
  console.log('  → Seeding alerts...');
  const now = new Date();
  const alerts = [
    { title: 'High Temperature', message: `Temperature in A101 reached 31.2°C — above threshold of 28°C`, severity: 'high', type: 'temperature', room: 'A101', isRead: false, createdAt: new Date(now.getTime() - 30 * 60000) },
    { title: 'Low Battery', message: `Device ESP32-Lab2 battery at 12% — replacement recommended`, severity: 'warning', type: 'battery', room: 'Lab2', isRead: false, createdAt: new Date(now.getTime() - 2 * 3600000) },
    { title: 'Device Offline', message: `Device ESP32-Auditorium has been offline for 4 hours`, severity: 'critical', type: 'device_offline', room: 'Auditorium', isRead: false, createdAt: new Date(now.getTime() - 4 * 3600000) },
    { title: 'High Humidity', message: `Humidity in Library at 72% — above comfort range (40-65%)`, severity: 'warning', type: 'humidity', room: 'Library', isRead: false, createdAt: new Date(now.getTime() - 5 * 3600000) },
    { title: 'Energy Waste Detected', message: `Lights left on in B203 after 19:00 with no presence detected`, severity: 'medium', type: 'energy', room: 'B203', isRead: false, createdAt: new Date(now.getTime() - 6 * 3600000) },
    { title: 'High Temperature', message: `Temperature in Lab1 reached 29.5°C`, severity: 'warning', type: 'temperature', room: 'Lab1', isRead: true, createdAt: new Date(now.getTime() - 8 * 3600000) },
    { title: 'Device Offline', message: `Device ESP32-B202 went offline briefly`, severity: 'medium', type: 'device_offline', room: 'B202', isRead: true, createdAt: new Date(now.getTime() - 12 * 3600000) },
    { title: 'Low Battery', message: `Device ESP32-A103 battery at 18%`, severity: 'warning', type: 'battery', room: 'A103', isRead: true, createdAt: new Date(now.getTime() - 18 * 3600000) },
    { title: 'High Temperature', message: `Temperature in A102 spiked to 30.1°C`, severity: 'high', type: 'temperature', room: 'A102', isRead: true, createdAt: new Date(now.getTime() - 24 * 3600000) },
    { title: 'Energy Waste', message: `HVAC running in B201 with 0 occupancy for 3 hours`, severity: 'medium', type: 'energy', room: 'B201', isRead: true, createdAt: new Date(now.getTime() - 26 * 3600000) },
    { title: 'High Humidity', message: `Humidity in Lab2 at 68%`, severity: 'low', type: 'humidity', room: 'Lab2', isRead: true, createdAt: new Date(now.getTime() - 30 * 3600000) },
    { title: 'System Alert', message: `ThingSpeak sync delayed by 15 minutes`, severity: 'low', type: 'system', room: '', isRead: true, createdAt: new Date(now.getTime() - 36 * 3600000) },
    { title: 'High Temperature', message: `Temperature in Library reached 28.3°C`, severity: 'warning', type: 'temperature', room: 'Library', isRead: true, createdAt: new Date(now.getTime() - 48 * 3600000) },
    { title: 'Low Battery', message: `Device ESP32-B201 battery at 22%`, severity: 'low', type: 'battery', room: 'B201', isRead: true, createdAt: new Date(now.getTime() - 60 * 3600000) },
    { title: 'Energy Waste', message: `Lights on in A101 overnight (00:00-06:00)`, severity: 'medium', type: 'energy', room: 'A101', isRead: true, createdAt: new Date(now.getTime() - 72 * 3600000) },
  ];
  await Alert.insertMany(alerts);
  console.log(`    ✓ ${alerts.length} alerts created (5 active, 10 resolved)`);
}

async function seedEnergy() {
  console.log('  → Seeding energy readings (today + this month)...');
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  const readings = [];

  for (const r of ROOMS) {
    const basePower = round1(rand(5, 18)); // kW baseline per room

    // Today's readings — every hour
    for (let h = 0; h < 24; h++) {
      const ts = new Date(now);
      ts.setHours(h, 0, 0, 0);
      if (ts > now) break;

      const isDaytime = h >= 8 && h <= 18;
      const isPeak = h >= 10 && h <= 14;
      const power = isPeak
        ? round1(basePower * rand(1.3, 1.8))
        : isDaytime
          ? round1(basePower * rand(0.8, 1.2))
          : round1(basePower * rand(0.1, 0.3));

      readings.push({
        room: r.room,
        totalEnergy: power,
        totalDuration: 1, // 1 hour
        isWaste: !isDaytime && power > basePower * 0.5 && Math.random() > 0.7,
        timestamp: ts,
      });
    }

    // This month — daily aggregates for previous days
    for (let d = 1; d < dayOfMonth; d++) {
      const ts = new Date(now.getFullYear(), now.getMonth(), d, 12, 0, 0);
      const dailyEnergy = round1(basePower * rand(8, 16));
      readings.push({
        room: r.room,
        totalEnergy: dailyEnergy,
        totalDuration: 24,
        isWaste: Math.random() > 0.8,
        timestamp: ts,
      });
    }
  }

  await EnergyReading.insertMany(readings);
  console.log(`    ✓ ${readings.length} energy readings created (today hourly + month daily per room)`);
}

async function seedRecommendations() {
  console.log('  → Seeding recommendations...');
  const now = new Date();
  const recs = [
    { type: 'energy', room: 'A101', message: 'Turn off lights after 18:00 — detected 3 nights of unnecessary usage.', priority: 'medium', status: 'active', createdAt: new Date(now.getTime() - 2 * 3600000) },
    { type: 'occupancy', room: 'Library', message: 'Move afternoon classes here — 45% occupancy vs 90% in A101.', priority: 'high', status: 'active', createdAt: new Date(now.getTime() - 4 * 3600000) },
    { type: 'energy', room: 'B201', message: 'HVAC running during unoccupied hours. Schedule AC to start at 07:30 instead of 06:00.', priority: 'high', status: 'active', createdAt: new Date(now.getTime() - 6 * 3600000) },
    { type: 'occupancy', room: 'B203', message: 'Meeting room underused (12% occupancy). Consider converting to study space.', priority: 'low', status: 'active', createdAt: new Date(now.getTime() - 8 * 3600000) },
    { type: 'energy', room: 'Lab1', message: 'Computers left on overnight. Enable sleep mode after 30 min inactivity.', priority: 'medium', status: 'active', createdAt: new Date(now.getTime() - 12 * 3600000) },
    { type: 'occupancy', room: 'Auditorium', message: 'Peak usage at 10:00 and 14:00. Reschedule non-peak events to off-hours.', priority: 'medium', status: 'active', createdAt: new Date(now.getTime() - 18 * 3600000) },
    { type: 'energy', room: 'Lab2', message: 'Battery at 12%. Replace sensor battery to avoid data gaps.', priority: 'high', status: 'active', createdAt: new Date(now.getTime() - 24 * 3600000) },
    { type: 'occupancy', room: 'A102', message: 'Room consistently at 85%+ occupancy. Consider increasing capacity or splitting classes.', priority: 'low', status: 'active', createdAt: new Date(now.getTime() - 36 * 3600000) },
  ];
  await Recommendation.insertMany(recs);
  console.log(`    ✓ ${recs.length} recommendations created`);
}

async function seedAuditLogs() {
  console.log("  → Seeding audit logs...");

  const now = new Date();

  // Get an existing user to reference
  const admin = await User.findOne({ email: "admin@campus.edu" });

  const logs = [
    {
      action: "Login",
      entityType: "User",
      entityId: admin?._id?.toString(),
      userId: admin?._id,
      details: { message: "Admin logged in" },
      ipAddress: "192.168.1.10",
      createdAt: new Date(now.getTime() - 30 * 60000),
    },
    {
      action: "Create",
      entityType: "User",
      entityId: admin?._id?.toString(),
      userId: admin?._id,
      details: { message: "User account created" },
      ipAddress: "192.168.1.11",
      createdAt: new Date(now.getTime() - 2 * 3600000),
    },
    {
      action: "Create",
      entityType: "Device",
      entityId: "ESP32-A101",
      userId: admin?._id,
      details: { message: "Device created" },
      ipAddress: "192.168.1.10",
      createdAt: new Date(now.getTime() - 5 * 3600000),
    },
    {
      action: "Import",
      entityType: "ThingSpeak",
      entityId: "ChannelSync",
      userId: admin?._id,
      details: { recordsImported: 1542 },
      ipAddress: "127.0.0.1",
      createdAt: new Date(now.getTime() - 6 * 3600000),
    },
    {
      action: "Update",
      entityType: "Alert",
      entityId: "Alert-001",
      userId: admin?._id,
      details: { message: "Alert resolved" },
      ipAddress: "192.168.1.10",
      createdAt: new Date(now.getTime() - 12 * 3600000),
    },
    {
      action: "Update",
      entityType: "Device",
      entityId: "ESP32-A101",
      userId: admin?._id,
      details: {
        led: "green",
        brightness: 150,
      },
      ipAddress: "192.168.1.10",
      createdAt: new Date(now.getTime() - 24 * 3600000),
    },
    {
      action: "Export",
      entityType: "Report",
      entityId: "EnergyReport",
      userId: admin?._id,
      details: {
        report: "Monthly Energy Report",
      },
      ipAddress: "192.168.1.10",
      createdAt: new Date(now.getTime() - 36 * 3600000),
    },
    {
      action: "Delete",
      entityType: "Device",
      entityId: "ESP32-OLD",
      userId: admin?._id,
      details: {
        reason: "Device replaced",
      },
      ipAddress: "192.168.1.10",
      createdAt: new Date(now.getTime() - 48 * 3600000),
    },
  ];

  await AuditLog.insertMany(logs);

  console.log(`    ✓ ${logs.length} audit logs created`);
}
// ─── Main ─────────────────────────────────────────────────────────────────────

async function clearAll() {
  console.log('  → Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Room.deleteMany({}),
    Device.deleteMany({}),
    Sensor.deleteMany({}),
    Alert.deleteMany({}),
    EnergyReading.deleteMany({}),
    Recommendation.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('    ✓ All collections cleared');
}

async function run() {
  console.log('\n🌱 Smart Campus — Simulation Seed');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✓ Connected to MongoDB: ${MONGO_URI}\n`);

    await clearAll();

    console.log('\n📦 Seeding collections:\n');
    await seedUsers();
    await seedRooms();
    await seedDevices();
    await seedSensors();
    await seedAlerts();
    await seedEnergy();
    await seedRecommendations();
    await seedAuditLogs();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ Simulation seed complete!\n');
    console.log('  Login:  admin@campus.edu / 123456');
    console.log('  Data:   10 rooms, 10 devices, ~840 sensors,');
    console.log('          15 alerts, energy data, 8 recommendations');
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
}

run();
