# Smart Campus API

## Firebase Realtime Database integration

The backend now uses Firebase Realtime Database as the ingestion layer for ESP32 devices.

### Environment variables

```env
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
SYNC_INTERVAL=*/1 * * * *
```

### ESP32 example

PUT to:

```text
https://your-project.firebaseio.com/campus/A101/latest.json?auth=YOUR_DATABASE_SECRET
```

Body:

```json
{
  "room": "A101",
  "temperature": 24,
  "humidity": 60,
  "light": 350,
  "presence": true,
  "battery": 85,
  "timestamp": "2026-07-09T10:30:00Z"
}
```

### API routes

- GET /api/firebase/latest
- GET /api/firebase/status
- POST /api/firebase/sync
- GET /api/firebase/history
