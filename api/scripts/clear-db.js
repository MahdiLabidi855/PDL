require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");

const User = require("../src/models/User");
const Sensor = require("../src/models/Sensor");
const Device = require("../src/models/Device");
const Alert = require("../src/models/Alert");
const AuditLog = require("../src/models/AuditLog");
const Room = require("../src/models/Room");

let EnergyReading = null;
let Recommendation = null;

try {
  EnergyReading = require("../src/models/EnergyReading");
} catch {}

try {
  Recommendation = require("../src/models/Recommendation");
} catch {}

async function clearDb() {
  await connectDB();

  await Promise.all([
    User.deleteMany({ email: /@smartcampus\.local$/ }),
    Sensor.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } }),
    Device.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } }),
    Alert.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } }),
    Room.deleteMany({ name: { $in: ["A101", "A102", "Library", "Lab-B201"] } }),
    AuditLog.deleteMany({}),
    EnergyReading
      ? EnergyReading.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } })
      : Promise.resolve(),
    Recommendation
      ? Recommendation.deleteMany({ room: { $in: ["A101", "A102", "Library", "Lab-B201"] } })
      : Promise.resolve(),
  ]);

  console.log("✅ Seed data cleared");
  await mongoose.connection.close();
}

clearDb().catch(async (err) => {
  console.error("You're right — here is the **clean full code again**, without the corrupted text.");})