// src/controllers/deviceController.js

const Device  = require('../models/Device');
const AuditLog = require('../models/AuditLog');
const { auditLogger } = require('../utils/auditLogger');

// ============ GET all devices ============
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: devices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============ GET single device ============
exports.getDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.status(200).json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============ CREATE device (admin) ============
exports.createDevice = async (req, res) => {
  try {
    const { deviceId, name, room, type } = req.body;

    const existing = await Device.findOne({ deviceId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Device already exists' });
    }

    const device = await Device.create({
      deviceId,
      name: name || `ESP32 - ${room}`,
      room,
      type: type || 'esp32',
      status: 'offline',
      isActive: true,
    });

    await auditLogger({
      action: 'CREATE_DEVICE',
      user: req.user?.id,
      details: { deviceId, room },
    });

    const io = req.app.get('io');
    if (io) io.emit('device:created', device);

    res.status(201).json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============ UPDATE device (admin) ============
exports.updateDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { $set: req.body },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await auditLogger({
      action: 'UPDATE_DEVICE',
      user: req.user?.id,
      details: { deviceId: req.params.deviceId, changes: req.body },
    });

    const io = req.app.get('io');
    if (io) io.emit('device:updated', device);

    res.status(200).json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============ DELETE device (admin) ============
exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ deviceId: req.params.deviceId });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await auditLogger({
      action: 'DELETE_DEVICE',
      user: req.user?.id,
      details: { deviceId: req.params.deviceId },
    });

    const io = req.app.get('io');
    if (io) io.emit('device:deleted', { deviceId: req.params.deviceId });

    res.status(200).json({ success: true, message: 'Device deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============ HEARTBEAT — auto-create if not in DB ============
exports.heartbeat = async (req, res) => {
  try {
    const { deviceId, room, battery, wifiSignal, firmware } = req.body;

    if (!deviceId || !room) {
      return res.status(400).json({
        success: false,
        message: 'deviceId and room are required',
      });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          room,
          battery,
          wifiSignal,
          firmware,
          status: 'online',
          lastSeen: new Date(),
        },
        $setOnInsert: {
          deviceId,
          name: `ESP32 - ${room}`,
          type: 'esp32',
          isActive: true,
          createdAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,               // ← auto-create if not found
        setDefaultsOnInsert: true,
      }
    );

    const io = req.app.get('io');
    if (io) io.emit('device:heartbeat', device);

    res.status(200).json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============ GET LED status (public — no auth) ============
exports.getLedStatus = async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        on:         device.led?.on         ?? false,
        color:      device.led?.color      ?? 'off',
        brightness: device.led?.brightness ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============ SET LED (admin) ============
exports.setLed = async (req, res) => {
  try {
    const { on, color, brightness } = req.body;

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        $set: {
          'led.on':         on         ?? false,
          'led.color':      color      ?? 'off',
          'led.brightness': brightness ?? 0,
        },
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await auditLogger({
      action: 'SET_LED',
      user: req.user?.id,
      details: { deviceId: req.params.deviceId, on, color, brightness },
    });

    const io = req.app.get('io');
    if (io) io.emit('device:led', { deviceId: req.params.deviceId, led: device.led });

    res.status(200).json({ success: true, data: device.led });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};