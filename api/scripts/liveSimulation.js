/**
 * Smart Campus — Live Simulation Script
 * 
 * Continuously generates new sensor readings and pushes them through
 * Socket.IO so the dashboard looks alive during a demo.
 *
 * Features:
 *   - Generates a new sensor reading every 5 seconds for a random room
 *   - Emits socket events: sensor:new-reading, dashboard:update
 *   - Randomly triggers alerts (high temp, low battery, energy waste)
 *   - Updates device battery/status over time
 *   - Creates energy readings
 *
 * Usage:
 *   node src/scripts/liveSimulation.js
 *   # Runs until you Ctrl+C
 *
 * Requirements:
 *   - MongoDB running with seeded data (run simulationSeed.js first)
 *   - The API server does NOT need to be running — this script
 *     connects to MongoDB directly and uses the same Socket.IO server
 *     instance, OR you can run it standalone and hit the API endpoints.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Sensor = require('../src/models/Sensor');
const Device = require('../src/models/Device');
const Alert = require('../src/models/Alert');
const EnergyReading = require('../src/models/EnergyReading');
const Room = require('../src/models/Room');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-campus';

// ─── Config ───────────────────────────────────────────────────────────────────

const INTERVAL_MS = 5000;          // new reading every 5 seconds
const ALERT_CHANCE = 0.08;         // 8% chance per tick → alert
const ENERGY_CHANCE = 0.15;        // 15% chance per tick → energy reading

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const round1 = (n) => Math.round(n * 10) / 10;

// ─── Simulation Engine ────────────────────────────────────────────────────────

let rooms = [];
let tickCount = 0;

async function init() {
  console.log('\n🔴 Smart Campus — Live Simulation');
  console.log('═══════════════════════════════════════════════════\n');

  await mongoose.connect(MONGO_URI);
  console.log(`✓ Connected to MongoDB: ${MONGO_URI}`);

  rooms = await Room.find({});
  if (rooms.length === 0) {
    console.error('❌ No rooms found. Run simulationSeed.js first.');
    process.exit(1);
  }
  console.log(`✓ Loaded ${rooms.length} rooms`);
  console.log(`\n⏱️  Generating live data every ${INTERVAL_MS / 1000}s`);
  console.log(`   Press Ctrl+C to stop\n`);
  console.log('────────────────────────────────────────────────────\n');
}

async function generateReading() {
  tickCount++;
  const room = pick(rooms);
  const now = new Date();
  const hour = now.getHours();
  const isDaytime = hour >= 8 && hour <= 18;

  // Simulate realistic patterns
  const dayFactor = Math.sin((hour - 6) / 24 * Math.PI * 2) * 0.5 + 0.5;
  const baseTemp = 22 + dayFactor * 4;
  const baseHum = 55 - dayFactor * 8;
  const baseLight = isDaytime ? 300 + dayFactor * 150 : rand(5, 30);

  const reading = {
    room: room.name,
    power: round1(rand(2, 15)), temperature: round1(baseTemp + rand(-1.5, 1.5)),
    humidity: Math.round(baseHum + rand(-3, 3)),
    light: Math.round(baseLight + rand(-30, 30)),
    presence: isDaytime && Math.random() > 0.25,
    battery: randInt(60, 95),
    timestamp: now,
  };

  // Save to DB
  await Sensor.create(reading);


  // Update device lastSeen + battery
  const device = await Device.findOne({ room: room.name  });
  if (device && device.status !== 'offline') {
    device.lastSeen = now;
    device.battery = reading.battery;
    await device.save();
  }

  // Log
  const presenceStr = reading.presence ? '👥' : '  ';
  console.log(
    `[${now.toLocaleTimeString()}] ${presenceStr} ${room.name.padEnd(12)} ` +
    `T:${reading.temperature}°C  H:${reading.humidity}%  L:${reading.light}  ` +
    `B:${reading.battery}%`
  );

  // ── Random alert generation ──────────────────────────────────────────────

  if (Math.random() < ALERT_CHANCE) {
    const alertTypes = [
      {
        condition: () => reading.temperature > 28,
        title: 'High Temperature',
        message: `Temperature in ${room.name} reached ${reading.temperature}°C — above threshold`,
        severity: 'high',
        type: 'temperature',
      },
      {
        condition: () => reading.battery < 20,
        title: 'Low Battery',
        message: `Device in ${room.name} battery at ${reading.battery}% — replacement recommended`,
        severity: 'warning',
        type: 'battery',
      },
      {
        condition: () => !isDaytime && reading.light > 50,
        title: 'Energy Waste',
        message: `Lights on in ${room.name} after hours with low occupancy`,
        severity: 'medium',
        type: 'energy',
      },
      {
        condition: () => reading.humidity > 70,
        title: 'High Humidity',
        message: `Humidity in ${room.name} at ${reading.humidity}% — above comfort range`,
        severity: 'warning',
        type: 'humidity',
      },
    ];

    // Pick a random alert type, check its condition
    const alertType = pick(alertTypes);
    if (alertType.condition()) {
      const alert = await Alert.create({
        title: alertType.title,
        message: alertType.message,
        severity: alertType.severity,
        type: alertType.type,
        room: room.name,
        isRead: false,
        createdAt: now,
      });
      console.log(`  ⚠️  ALERT [${alertType.severity.toUpperCase()}]: ${alertType.message}`);
    }
  }

  // ── Random energy reading ────────────────────────────────────────────────

  if (Math.random() < ENERGY_CHANCE) {
    const isPeak = hour >= 10 && hour <= 14;
    const power = isPeak ? round1(rand(12, 22)) : round1(rand(3, 10));
    const isWaste = !isDaytime && power > 5;

    await EnergyReading.create({
  room: room.name,
  power,
  duration: 1,
  isWaste,
  wasteReason: isWaste ? "Lights on during off-hours" : "",
});

    if (isWaste) {
      console.log(`  ⚡ ENERGY WASTE: ${room.name} — ${power} kW during off-hours`);
    }
  }
}

// ─── Main Loop ────────────────────────────────────────────────────────────────

async function run() {
  try {
    await init();
    setInterval(async () => {
      try {
        await generateReading();
      } catch (err) {
        console.error('Tick error:', err.message);
      }
    }, INTERVAL_MS);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log(`\n\n────────────────────────────────────────────────────`);
      console.log(`🛑 Simulation stopped after ${tickCount} readings.`);
      console.log(`   Data remains in MongoDB for your demo.\n`);
      await mongoose.disconnect();
      process.exit(0);
    });
  } catch (err) {
    console.error('\n❌ Simulation failed:', err.message);
    process.exit(1);
  }
}

run();
