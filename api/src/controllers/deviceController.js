const Device = require("../models/Device");
const Alert = require("../models/Alert");
const socket = require("../socket/socket");
const axios = require('axios');
const { logAudit } = require("../utils/auditLogger");

// ============ CRUD ============

exports.getDevices = async (req, res) => {
    try {
        const devices = await Device.find().sort({ createdAt: -1 });
        res.json({ success: true, count: devices.length, data: devices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createDevice = async (req, res) => {
    try {
        const device = await Device.create(req.body);

        const io = socket.getIO();
        if (io) {
            io.emit("device:heartbeat", device);
            io.emit("device:online", device);
            io.emit("dashboard:update", { type: "device-created", device: device._id });
        }

        await logAudit({
            action: "Create",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: { cardName: device.cardName, room: device.room },
            req
        });

        res.status(201).json({ success: true, data: device });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.updateDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndUpdate(
            req.params.id,
            req.body,
            {  returnDocument: "after", runValidators: true }
        );

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("dashboard:update", { type: "device-updated", device: device._id });
        }

        await logAudit({
            action: "Update",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: req.body,
            req
        });

        res.json({ success: true, data: device });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("device:offline", { deviceId: device._id, room: device.room });
            io.emit("dashboard:update", { type: "device-deleted", device: device._id });
        }

        await logAudit({
            action: "Delete",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: { cardName: device.cardName, room: device.room },
            req
        });

        res.json({ success: true, message: "Device deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============ HEARTBEAT ============

exports.heartbeat = async (req, res) => {
    try {
        const { deviceId, battery, wifiSignal, firmware , thingspeakChannelId, thingspeakReadKey } = req.body;
  const updateFields = {
      status: "online",
      lastSeen: new Date(),
    };
     if (battery    !== undefined) updateFields.battery    = battery;
    if (wifiSignal !== undefined) updateFields.wifiSignal = wifiSignal;
    if (firmware   !== undefined) updateFields.firmware   = firmware;

    // Save ThingSpeak credentials from ESP32
    if (thingspeakChannelId) updateFields.thingSpeakChannelId = thingspeakChannelId;
    if (thingspeakReadKey)   updateFields.thingSpeakReadKey   = thingspeakReadKey;

          const device = await Device.findOneAndUpdate(
      { deviceId },
      updateFields,
      { upsert: true, returnDocument: "after" }
    );

        const io = socket.getIO();
        if (io) {
            io.emit("device:heartbeat", device);
            io.emit("device:online", device);
            io.emit("dashboard:update", { type: "heartbeat", device: device._id });
        }

        // Auto-generate low battery alert
        if (battery !== undefined && battery < 20) {
            const existingAlert = await Alert.findOne({
                device: device._id,
                type: "low_battery",
                status: "active"
            });

            if (!existingAlert) {
                const alert = await Alert.create({
                    type: "low_battery",
                    device: device._id,
                    room: device.room,
                    severity: "critical",
                    status: "active",
                    message: `Low battery on ${device.cardName}: ${battery}%`
                });

                if (io) {
                    io.emit("alert:new", alert);
                    io.emit("maintenance:warning", alert);
                }
            }
        }

        res.json({ success: true, data: device });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============ LED CONTROL ============
exports.updateLed = async (req, res) => {
  try {
    const { on } = req.body; // front sends: { on: true/false }

    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    let ledState = { on: false, color: 'off', brightness: 0 };

    if (on) {
      // ── Fetch latest sensor data from ThingSpeak ──────────────────
      let temperature = null, humidity = null, light = null, presence = null;

      if (device.thingSpeakChannelId && device.thingSpeakApiKey) {
        try {
          const tsUrl = `https://api.thingspeak.com/channels/${device.thingSpeakChannelId}/feeds/last.json?api_key=${device.thingSpeakApiKey}`;
          const tsRes = await axios.get(tsUrl, { timeout: 8000 });
          const feed  = tsRes.data?.feeds?.[0] || tsRes.data;

          // field mapping: field1=temp, field2=humidity, field3=light, field4=presence
          temperature = parseFloat(feed?.field1);
          humidity    = parseFloat(feed?.field2);
          light       = parseFloat(feed?.field3);
          presence    = parseInt(feed?.field4) === 1;
        } catch (tsErr) {
          console.warn('[LED] ThingSpeak fetch failed:', tsErr.message);
        }
      }

      // ── Determine color from sensor conditions ────────────────────
      let color      = 'green'; // default
      let brightness = 200;

      if (!isNaN(temperature) && temperature > 30) {
        color      = 'red';    // 🔴 Heat alert
        brightness = 255;
      } else if (!isNaN(humidity) && humidity > 70) {
        color      = 'blue';   // 🔵 High humidity
        brightness = 200;
      } else if (!isNaN(light) && light < 100) {
        color      = 'yellow'; // 🟡 Dark room
        brightness = 200;
      } else if (presence) {
        color      = 'green';  // 🟢 Room occupied
        brightness = 180;
      }

      ledState = { on: true, color, brightness };
    }

    // ── Write command to ThingSpeak field6 ────────────────────────
    if (device.thingSpeakChannelId && device.thingSpeakApiKey) {
      try {
        const field6Value = on
          ? `1:${ledState.color}:${ledState.brightness}`
          : '0:off:0';

        await axios.get(
          `http://api.thingspeak.com/update?api_key=${device.thingSpeakApiKey}&field6=${encodeURIComponent(field6Value)}`,
          { timeout: 8000 }
        );
      } catch (tsErr) {
        console.warn('[LED] ThingSpeak write failed:', tsErr.message);
        // don't fail the request — still save to DB
      }
    }

    // ── Persist to MongoDB ─────────────────────────────────────────
    const updated = await Device.findByIdAndUpdate(
      req.params.id,
      {
        'ledStatus.on':          ledState.on,
        'ledStatus.color':       ledState.color,
        'ledStatus.brightness':  ledState.brightness,
        'ledStatus.lastUpdated': new Date()
      },
      { returnDocument: 'after' }
    );

    // ── Emit socket ────────────────────────────────────────────────
    const io = socket.getIO();
    if (io) {
      io.emit('device:led-update', {
        deviceId:  updated._id,
        ledStatus: updated.ledStatus
      });
      io.emit('dashboard:update', { type: 'led-update', device: updated._id });
    }

    await logAudit({
      action:     'Update',
      entityType: 'Device',
      entityId:   updated._id.toString(),
      userId:     req.user?.id || null,
      details:    { event: 'led-update', ledStatus: updated.ledStatus },
      req
    });

    res.json({ success: true, data: updated.ledStatus });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============ GET LED STATUS — reads from ThingSpeak, syncs to DB ============

exports.getLedStatus = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Start with DB value as fallback
    let ledState = {
      on:         device.ledStatus?.on         ?? false,
      color:      device.ledStatus?.color      ?? 'off',
      brightness: device.ledStatus?.brightness ?? 0
    };

    // ── Async fetch from ThingSpeak field6 ────────────────────────
    if (device.thingSpeakChannelId && device.thingSpeakApiKey) {
      try {
        const tsUrl = `http://api.thingspeak.com/channels/${device.thingSpeakChannelId}/fields/6/last.txt?api_key=${device.thingSpeakApiKey}`;
        const tsRes  = await axios.get(tsUrl, { timeout: 8000 });
        const field6 = tsRes.data?.toString().trim();

        if (field6 && field6 !== '-1') {
          const parts = field6.split(':');

          if (parts.length === 3) {
            ledState = {
              on:         parts[0] === '1',
              color:      parts[1] || 'off',
              brightness: parseInt(parts[2]) || 0
            };
          } else if (field6 === '0') {
            ledState = { on: false, color: 'off', brightness: 0 };
          } else if (field6 === '1') {
            ledState = {
              on:         true,
              color:      device.ledStatus?.color ?? 'green',
              brightness: device.ledStatus?.brightness ?? 200
            };
          }

          // Sync ThingSpeak value back to DB
          await Device.findByIdAndUpdate(req.params.id, {
            'ledStatus.on':          ledState.on,
            'ledStatus.color':       ledState.color,
            'ledStatus.brightness':  ledState.brightness,
            'ledStatus.lastUpdated': new Date()
          });
        }
      } catch (tsErr) {
        console.warn('[LED] ThingSpeak read failed:', tsErr.message);
        // return DB value silently
      }
    }

    res.json({ success: true, data: ledState });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ============ CARD CONFIG ============

exports.updateConfig = async (req, res) => {
    try {
        const { thingSpeakChannelId, thingSpeakApiKey, thingSpeakFieldMapping } = req.body;

        const device = await Device.findByIdAndUpdate(
            req.params.id,
            {
                thingSpeakChannelId,
                thingSpeakApiKey,
                thingSpeakFieldMapping
            },
            {  returnDocument: "after" }
        );

        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const io = socket.getIO();
        if (io) {
            io.emit("device:config-updated", {
                deviceId: device._id,
                config: {
                    channelId: thingSpeakChannelId,
                    fieldMapping: thingSpeakFieldMapping
                }
            });
            io.emit("dashboard:update", { type: "config-updated", device: device._id });
        }

        await logAudit({
            action: "Update",
            entityType: "Device",
            entityId: device._id.toString(),
            userId: req.user?.id || null,
            details: { event: "config-update", channelId: thingSpeakChannelId },
            req
        });

        res.json({ success: true, data: device });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getConfig = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id).select(
            "cardName thingSpeakChannelId thingSpeakApiKey thingSpeakFieldMapping"
        );
        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }
        res.json({ success: true, data: device });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};