# Smart Campus API

IoT platform for university campus management. ESP32 sensors → ThingSpeak → Node.js → MongoDB → Socket.IO → React.

## Setup

```bash
cd api
npm install
cp .env.example .env
npm run dev
```

## Environment

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart-campus
JWT_SECRET=supersecret
THINGSPEAK_BASE_URL=https://api.thingspeak.com
THINGSPEAK_SYNC_INTERVAL=*/1 * * * *
```

## ESP32 (Wokwi)

Each Wokwi copy = 1 classroom. Change 3 variables:

```cpp
const char* THINGSPEAK_CHANNEL_ID = "2859XXX";
const char* THINGSPEAK_API_KEY    = "XXXXXXXXXX";
const char* ROOM                  = "A101";
```

Sends 5 fields every 15s: temperature, humidity, light, presence, battery.

## API Endpoints

### Auth

| Method | Path | Auth |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |

### Devices

| Method | Path | Auth |
|---|---|---|
| GET | /api/devices | JWT |
| POST | /api/devices | JWT |
| PUT | /api/devices/:id | JWT |
| DELETE | /api/devices/:id | JWT |
| POST | /api/devices/heartbeat | Public |
| PUT | /api/devices/:id/led | JWT |
| GET | /api/devices/:id/led | JWT |
| PUT | /api/devices/:id/config | JWT |
| GET | /api/devices/:id/config | JWT |

### ThingSpeak

| Method | Path | Auth |
|---|---|---|
| GET | /api/thingspeak/latest | JWT |
| GET | /api/thingspeak/status | JWT |
| POST | /api/thingspeak/sync | Admin |
| GET | /api/thingspeak/history | JWT |

### Dashboard

| Method | Path | Auth |
|---|---|---|
| GET | /api/dashboard/live | JWT |
| GET | /api/dashboard/statistics | JWT |
| GET | /api/dashboard/occupancy | JWT |
| GET | /api/dashboard/peak-hours | JWT |
| GET | /api/dashboard/top-rooms | JWT |
| GET | /api/dashboard/underused-rooms | JWT |
| GET | /api/dashboard/environment | JWT |
| GET | /api/dashboard/energy | JWT |
| GET | /api/dashboard/trends | JWT |

### Alerts

| Method | Path | Auth |
|---|---|---|
| GET | /api/alerts | JWT |
| PUT | /api/alerts/:id/resolve | JWT |

### Other

| Method | Path | Auth |
|---|---|---|
| GET | /api/recommendations | JWT |
| GET | /api/energy/today | JWT |
| GET | /api/energy/month | JWT |
| GET | /api/energy/waste | JWT |
| GET | /api/energy/rooms | JWT |
| GET | /api/maintenance | JWT |
| GET | /api/prediction | JWT |
| GET | /api/map | JWT |
| GET | /api/map/:room | JWT |
| GET | /reports/pdf | JWT |
| GET | /api/audit-logs | JWT |
| GET | /api-docs | Public |

## Socket.IO Events

`sensor:new-reading`, `sensor:update`, `sensor:delete`, `dashboard:update`, `device:heartbeat`, `device:online`, `device:offline`, `device:led-update`, `device:config-updated`, `alert:new`, `alert:resolved`, `energy:update`, `recommendation:new`, `maintenance:warning`

## Alert Rules

| Rule | Condition | Severity |
|---|---|---|
| High temperature | temp > 30°C | Warning |
| High humidity | humidity > 80% | Warning |
| Low battery | battery < 20% | Critical |
| Energy waste | presence=false AND light>500 | Warning |
| Device offline | No heartbeat in 5 min | Critical |

## Jobs

| Job | Schedule |
|---|---|
| ThingSpeak sync | Every 1 min |
| Offline device check | Every 5 min |