// test-full-scenario.mjs
// Run with: node test-full-scenario.mjs
// Requires: Node 18+
// Optional env:
//   BASE_URL=http://localhost:5000
//   THINGSPEAK_CHANNEL_ID=your_real_channel_id
//   THINGSPEAK_API_KEY=your_real_read_api_key

import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const API = `${BASE_URL}/api`;

const NOW = Date.now();
const TEST_EMAIL = `mahdi_test_${NOW}@campus.local`;
const TEST_PASSWORD = "123456";
const TEST_NAME = "Mahdi Test Admin";

const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || "";
const THINGSPEAK_API_KEY = process.env.THINGSPEAK_API_KEY || "";

let token = null;
let createdDeviceId = null;
let createdAlertId = null;

function logStep(title) {
  console.log(`\n==============================`);
  console.log(title);
  console.log(`==============================`);
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
}

async function request(method, url, body = null, useAuth = true, extraHeaders = {}) {
  const headers = {
    ...extraHeaders,
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (useAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  const data = await parseResponse(res);

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

function printResult(label, result) {
  const short =
    typeof result.data === "string"
      ? result.data
      : JSON.stringify(result.data, null, 2);

  console.log(`\n[${label}] Status: ${result.status}`);
  console.log(short);
}

async function safeCall(label, fn) {
  try {
    const result = await fn();
    printResult(label, result);
    return result;
  } catch (err) {
    console.error(`\n[${label}] FAILED`);
    console.error(err);
    return null;
  }
}

async function register() {
  return await request("POST", `${API}/auth/register`, {
    name: TEST_NAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    role: "admin",
  }, false);
}

async function login() {
  const result = await request("POST", `${API}/auth/login`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }, false);

  if (result.ok && result.data?.token) {
    token = result.data.token;
  }

  return result;
}

async function createDevice() {
  return await request("POST", `${API}/devices`, {
    deviceId: `ESP32-A101-${NOW}`,
    cardName: "Classroom A101 Test Card",
    cardType: "esp32",
    room: "A101",
    floor: 1,
    thingSpeakChannelId: THINGSPEAK_CHANNEL_ID || "TEST_CHANNEL",
    thingSpeakApiKey: THINGSPEAK_API_KEY || "TEST_API_KEY",
  });
}

async function getDevices() {
  return await request("GET", `${API}/devices`);
}

async function updateDevice(deviceId) {
  return await request("PUT", `${API}/devices/${deviceId}`, {
    cardName: "Classroom A101 Updated",
    floor: 2,
    status: "online",
  });
}

async function sendHeartbeatLowBattery(deviceIdValue) {
  return await request("POST", `${API}/devices/heartbeat`, {
    deviceId: deviceIdValue,
    battery: 15,
    wifiSignal: -45,
    firmware: "1.0.1",
  }, false);
}

async function sendHeartbeatNormal(deviceIdValue) {
  return await request("POST", `${API}/devices/heartbeat`, {
    deviceId: deviceIdValue,
    battery: 85,
    wifiSignal: -40,
    firmware: "1.0.1",
  }, false);
}

async function updateLed(deviceId) {
  return await request("PUT", `${API}/devices/${deviceId}/led`, {
    on: true,
    color: "green",
    brightness: 180,
  });
}

async function getLed(deviceId) {
  return await request("GET", `${API}/devices/${deviceId}/led`);
}

async function updateConfig(deviceId) {
  return await request("PUT", `${API}/devices/${deviceId}/config`, {
    thingSpeakChannelId: THINGSPEAK_CHANNEL_ID || "TEST_CHANNEL_UPDATED",
    thingSpeakApiKey: THINGSPEAK_API_KEY || "TEST_API_KEY_UPDATED",
    thingSpeakFieldMapping: {
      field1: "temperature",
      field2: "humidity",
      field3: "light",
      field4: "presence",
      field5: "battery",
    },
  });
}

async function getConfig(deviceId) {
  return await request("GET", `${API}/devices/${deviceId}/config`);
}

// Assumes POST /api/sensors exists in your backend.
// If your backend uses another path, change this one line only.
async function seedSensors() {
  const samples = [
    {
      room: "A101",
      temperature: 31,
      humidity: 82,
      light: 650,
      presence: false,
      battery: 15,
      timestamp: new Date().toISOString(),
    },
    {
      room: "Library",
      temperature: 24,
      humidity: 55,
      light: 350,
      presence: true,
      battery: 90,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      room: "A102",
      temperature: 26,
      humidity: 60,
      light: 250,
      presence: true,
      battery: 88,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const results = [];
  for (const sample of samples) {
    const res = await request("POST", `${API}/sensors`, sample);
    results.push({ sample, status: res.status, data: res.data });
  }

  return {
    ok: true,
    status: 200,
    data: results,
  };
}

async function getDashboard() {
  const endpoints = [
    "/dashboard/live",
    "/dashboard/statistics",
    "/dashboard/occupancy",
    "/dashboard/peak-hours",
    "/dashboard/top-rooms",
    "/dashboard/underused-rooms",
    "/dashboard/environment",
    "/dashboard/energy",
    "/dashboard/trends?period=daily",
  ];

  const results = [];
  for (const ep of endpoints) {
    const res = await request("GET", `${API}${ep}`);
    results.push({ endpoint: ep, status: res.status, data: res.data });
  }

  return {
    ok: true,
    status: 200,
    data: results,
  };
}

async function getAlerts() {
  return await request("GET", `${API}/alerts`);
}

async function resolveFirstAlert() {
  const alertsRes = await getAlerts();

  if (!alertsRes.ok || !Array.isArray(alertsRes.data?.data) || alertsRes.data.data.length === 0) {
    return {
      ok: true,
      status: 200,
      data: { message: "No alert to resolve" },
    };
  }

  const first = alertsRes.data.data[0];
  createdAlertId = first._id;

  return await request("PUT", `${API}/alerts/${first._id}/resolve`);
}

async function getRecommendations() {
  return await request("GET", `${API}/recommendations`);
}

async function getEnergy() {
  const endpoints = [
    "/energy/today",
    "/energy/month",
    "/energy/waste",
    "/energy/rooms",
  ];

  const results = [];
  for (const ep of endpoints) {
    const res = await request("GET", `${API}${ep}`);
    results.push({ endpoint: ep, status: res.status, data: res.data });
  }

  return {
    ok: true,
    status: 200,
    data: results,
  };
}

async function getMaintenance() {
  return await request("GET", `${API}/maintenance`);
}

async function getPrediction() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return await request(
    "GET",
    `${API}/prediction?room=Library&date=${tomorrow}`
  );
}

async function getMap() {
  const mapRes = await request("GET", `${API}/map`);
  const roomRes = await request("GET", `${API}/map/A101`);

  return {
    ok: true,
    status: 200,
    data: {
      allRooms: {
        status: mapRes.status,
        data: mapRes.data,
      },
      oneRoom: {
        status: roomRes.status,
        data: roomRes.data,
      },
    },
  };
}

async function getReports() {
  const tokenHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const url = `${BASE_URL}/reports/pdf?type=daily&date=${new Date().toISOString().slice(0, 10)}`;

  const res = await fetch(url, { headers: tokenHeader });
  const buffer = Buffer.from(await res.arrayBuffer());

  if (res.ok) {
    fs.writeFileSync("test-report.pdf", buffer);
  }

  return {
    ok: res.ok,
    status: res.status,
    data: res.ok
      ? { message: "PDF downloaded", file: "test-report.pdf", bytes: buffer.length }
      : { message: buffer.toString("utf8") },
  };
}

async function testThingSpeak(deviceId) {
  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_API_KEY) {
    return {
      ok: true,
      status: 200,
      data: {
        message: "ThingSpeak tests skipped. Set THINGSPEAK_CHANNEL_ID and THINGSPEAK_API_KEY to run them.",
      },
    };
  }

  const latest = await request("GET", `${API}/thingspeak/latest?deviceId=${deviceId}`);
  const status = await request("GET", `${API}/thingspeak/status`);
  const history = await request(
    "GET",
    `${API}/thingspeak/history?deviceId=${deviceId}&from=2026-01-01&to=2026-12-31`
  );
  const sync = await request("POST", `${API}/thingspeak/sync`);

  return {
    ok: true,
    status: 200,
    data: {
      latest: { status: latest.status, data: latest.data },
      status: { status: status.status, data: status.data },
      history: { status: history.status, data: history.data },
      sync: { status: sync.status, data: sync.data },
    },
  };
}

async function deleteDevice(deviceId) {
  return await request("DELETE", `${API}/devices/${deviceId}`);
}

async function main() {
  console.log(`Base URL: ${BASE_URL}`);

  logStep("1) REGISTER");
  const reg = await safeCall("REGISTER", register);

  logStep("2) LOGIN");
  const log = await safeCall("LOGIN", login);
  if (!log?.ok || !token) {
    console.error("Login failed. Stopping.");
    process.exit(1);
  }

  logStep("3) CREATE DEVICE");
  const created = await safeCall("CREATE DEVICE", createDevice);
  if (created?.ok && created.data?.data?._id) {
    createdDeviceId = created.data.data._id;
  }

  const deviceIdValue = created?.data?.data?.deviceId || `ESP32-A101-${NOW}`;

  logStep("4) GET DEVICES");
  await safeCall("GET DEVICES", getDevices);

  if (createdDeviceId) {
    logStep("5) UPDATE DEVICE");
    await safeCall("UPDATE DEVICE", () => updateDevice(createdDeviceId));
  }

  logStep("6) HEARTBEAT LOW BATTERY (create alert)");
  await safeCall("HEARTBEAT LOW BATTERY", () => sendHeartbeatLowBattery(deviceIdValue));

  logStep("7) HEARTBEAT NORMAL");
  await safeCall("HEARTBEAT NORMAL", () => sendHeartbeatNormal(deviceIdValue));

  if (createdDeviceId) {
    logStep("8) UPDATE LED");
    await safeCall("UPDATE LED", () => updateLed(createdDeviceId));

    logStep("9) GET LED");
    await safeCall("GET LED", () => getLed(createdDeviceId));

    logStep("10) UPDATE CONFIG");
    await safeCall("UPDATE CONFIG", () => updateConfig(createdDeviceId));

    logStep("11) GET CONFIG");
    await safeCall("GET CONFIG", () => getConfig(createdDeviceId));
  }

  logStep("12) SEED SENSORS");
  await safeCall("SEED SENSORS", seedSensors);

  logStep("13) DASHBOARD ROUTES");
  await safeCall("DASHBOARD", getDashboard);

  logStep("14) ALERTS");
  await safeCall("GET ALERTS", getAlerts);

  logStep("15) RESOLVE FIRST ALERT");
  await safeCall("RESOLVE ALERT", resolveFirstAlert);

  logStep("16) RECOMMENDATIONS");
  await safeCall("RECOMMENDATIONS", getRecommendations);

  logStep("17) ENERGY");
  await safeCall("ENERGY", getEnergy);

  logStep("18) MAINTENANCE");
  await safeCall("MAINTENANCE", getMaintenance);

  logStep("19) PREDICTION");
  await safeCall("PREDICTION", getPrediction);

  logStep("20) CAMPUS MAP");
  await safeCall("MAP", getMap);

  logStep("21) REPORT DOWNLOAD");
  await safeCall("REPORT", getReports);

  if (createdDeviceId) {
    logStep("22) THINGSPEAK");
    await safeCall("THINGSPEAK", () => testThingSpeak(createdDeviceId));
  }

  if (createdDeviceId) {
    logStep("23) DELETE DEVICE");
    await safeCall("DELETE DEVICE", () => deleteDevice(createdDeviceId));
  }

  logStep("24) LOGOUT");
  token = null;
  console.log("Local token cleared. API has no dedicated /logout endpoint.");

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});