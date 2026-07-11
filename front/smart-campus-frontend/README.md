# Smart Campus — React + Vite Frontend Source Bundle

This document contains a complete, ready-to-build React frontend for the **Smart Campus Analytics Platform**. It consumes every API area described in the project spec: Auth, Dashboard, Devices, ThingSpeak, Alerts, Recommendations, Energy, Maintenance, Prediction, Campus Map, and Reports. It also wires up all documented Socket.IO events.

---

## Project Structure

```
front/smart-campus-frontend/
├── index.html
├── package.json
├── vite.config.js
├── README.md (optional)
└── src
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── context
    │   └── AuthContext.jsx
    ├── components
    │   ├── ProtectedRoute.jsx
    │   ├── Layout.jsx
    │   ├── StatCard.jsx
    │   ├── Loading.jsx
    │   └── ErrorMessage.jsx
    ├── services
    │   ├── api.js
    │   └── socket.js
    └── pages
        ├── Login.jsx
        ├── Register.jsx
        ├── Dashboard.jsx
        ├── Devices.jsx
        ├── DeviceDetail.jsx
        ├── LiveSensors.jsx
        ├── Alerts.jsx
        ├── Recommendations.jsx
        ├── Energy.jsx
        ├── Maintenance.jsx
        ├── Prediction.jsx
        ├── CampusMap.jsx
        ├── Reports.jsx
        └── NotFound.jsx
```

---

## Install Commands

```bash
cd front/smart-campus-frontend
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom socket.io-client recharts lucide-react
npm install -D @vitejs/plugin-react
```

---

## Assumptions & Backend Notes

1. **Login response** — The task says `POST /api/auth/login` returns `{ token: '...' }`. The guide also shows `{ token, user }`. `AuthContext` handles both: if `user` is missing, it builds a minimal user from the JWT payload.
2. **Register response** — The task says `POST /api/auth/register` returns `{ message: 'User created' }`. `Register.jsx` redirects to `/login` on success. If the backend also returns a token, it logs the user in directly.
3. **Dashboard helper endpoints** (`top-rooms`, `underused-rooms`, `environment`, `energy`, `trends`) are not fully shaped in the spec. The code assumes `{ success: true, data: [...] }` or `{ success: true, data: {...} }` and falls back to empty arrays/objects gracefully.
4. **Single device fetch** — The provided endpoint list does **not** include `GET /api/devices/:id` (the guide lists it as a suggestion). `DeviceDetail.jsx` therefore filters the full device list by `_id`. If your backend implements `GET /api/devices/:id`, add `getById: (id) => api.get(`/devices/${id}`)` to `services/api.js` and use it in `DeviceDetail.jsx`.
5. **Reports** — The PDF endpoint is `/reports/pdf` (not under `/api`). The Vite proxy forwards `/reports` to the backend. The download function sends the JWT token manually because browser `<a>` downloads cannot attach `Authorization` headers.
6. **Socket.IO** — Connects directly to `http://localhost:5000`. The Vite proxy also forwards `/socket.io` if you prefer to connect via the same origin in production.
7. **Realtime updates** — Each page subscribes to the relevant Socket.IO events and refreshes its local data. No event payload shapes are invented beyond what is documented.

---

## `package.json`

```json
{
  "name": "smart-campus-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "lucide-react": "^0.400.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.1",
    "recharts": "^2.12.7",
    "socket.io-client": "^4.7.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.1"
  }
}
```

---

## `vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/reports': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
```

---

## `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Smart Campus Analytics</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## `src/index.css`

```css
:root {
  --primary: #1f4e79;
  --primary-light: #2b6cb0;
  --bg: #f3f4f6;
  --card: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;
  --success: #22c55e;
  --warning: #eab308;
  --danger: #ef4444;
  --sidebar-width: 260px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
}

a {
  color: var(--primary-light);
  text-decoration: none;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  transition: opacity 0.15s ease;
}

button:hover {
  opacity: 0.92;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-warning {
  background: var(--warning);
  color: #422006;
}

input, select, textarea {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.95rem;
  width: 100%;
}

label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.page-title {
  margin: 0;
  font-size: 1.6rem;
}

.grid {
  display: grid;
  gap: 1rem;
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.card {
  background: var(--card);
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.card h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.badge-online, .badge-ok, .badge-resolved, .badge-low {
  background: #dcfce7;
  color: #166534;
}

.badge-warning, .badge-medium {
  background: #fef9c3;
  color: #854d0e;
}

.badge-critical, .badge-offline, .badge-high, .badge-active {
  background: #fee2e2;
  color: #991b1b;
}

.badge-info, .badge-low {
  background: #dbeafe;
  color: #1e40af;
}

/* Layout */
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--primary);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 100;
  transform: translateX(0);
  transition: transform 0.2s ease;
}

.sidebar.closed {
  transform: translateX(-100%);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}

.sidebar-brand {
  font-size: 1.15rem;
  font-weight: 700;
}

.sidebar-toggle {
  background: transparent;
  color: white;
  padding: 0.25rem;
}

.sidebar-nav {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  border-radius: 8px;
  color: rgba(255,255,255,0.85);
  font-size: 0.95rem;
}

.nav-link:hover, .nav-link.active {
  background: rgba(255,255,255,0.12);
  color: white;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255,255,255,0.15);
}

.logout-btn {
  width: 100%;
  background: rgba(255,255,255,0.12);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.main {
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
}

.topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--primary);
  color: white;
}

.topbar-title {
  font-weight: 700;
}

@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .main {
    margin-left: 0;
  }
  .topbar {
    display: flex;
  }
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 90;
}

/* Loading */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Auth pages */
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--card);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.auth-card h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
}

.auth-card p {
  color: var(--muted);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.auth-footer {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
}

/* StatCard */
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-title {
  color: var(--muted);
  font-size: 0.85rem;
}

/* Tables */
.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

th, td {
  text-align: left;
  padding: 0.7rem 0.6rem;
  border-bottom: 1px solid var(--border);
}

th {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
}

/* Map */
.map-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: #eef2f7;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.map-room {
  position: absolute;
  transform: translate(-50%, -50%);
  min-width: 90px;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: white;
  border: 2px solid var(--border);
  text-align: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.map-room:hover {
  border-color: var(--primary-light);
}

.map-room-name {
  font-weight: 700;
  font-size: 0.85rem;
}

.map-room-meta {
  font-size: 0.75rem;
  color: var(--muted);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* Utilities */
.text-muted {
  color: var(--muted);
}

.text-sm {
  font-size: 0.85rem;
}

.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.flex { display: flex; }
.gap-1 { gap: 0.5rem; }
.gap-2 { gap: 1rem; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.wrap { flex-wrap: wrap; }
```

---

## `src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sc_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const payload = parseJwt(token);
      setUser(
        payload
          ? {
              id: payload.id || payload.sub || payload.userId,
              email: payload.email || '',
              name: payload.name || payload.email || 'User',
              role: payload.role || 'user',
            }
          : { id: '', email: '', name: 'User', role: 'user' }
      );
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = (data) => {
    const t = data.token;
    if (!t) return;
    localStorage.setItem('sc_token', t);
    setToken(t);

    if (data.user) {
      setUser(data.user);
    } else {
      const payload = parseJwt(t);
      setUser(
        payload
          ? {
              id: payload.id || payload.sub || payload.userId,
              email: payload.email || '',
              name: payload.name || payload.email || 'User',
              role: payload.role || 'user',
            }
          : { id: '', email: '', name: 'User', role: 'user' }
      );
    }
  };

  const logout = () => {
    localStorage.removeItem('sc_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## `src/services/api.js`

```js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sc_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
};

export const dashboardApi = {
  live: () => api.get('/dashboard/live'),
  statistics: () => api.get('/dashboard/statistics'),
  occupancy: () => api.get('/dashboard/occupancy'),
  peakHours: () => api.get('/dashboard/peak-hours'),
  topRooms: () => api.get('/dashboard/top-rooms'),
  underusedRooms: () => api.get('/dashboard/underused-rooms'),
  environment: () => api.get('/dashboard/environment'),
  energy: () => api.get('/dashboard/energy'),
  trends: (period = 'daily') => api.get(`/dashboard/trends?period=${period}`),
};

export const deviceApi = {
  list: () => api.get('/devices'),
  create: (body) => api.post('/devices', body),
  update: (id, body) => api.put(`/devices/${id}`, body),
  remove: (id) => api.delete(`/devices/${id}`),
  heartbeat: (body) => api.post('/devices/heartbeat', body),
  getLed: (id) => api.get(`/devices/${id}/led`),
  setLed: (id, body) => api.put(`/devices/${id}/led`, body),
  getConfig: (id) => api.get(`/devices/${id}/config`),
  setConfig: (id, body) => api.put(`/devices/${id}/config`, body),
};

export const thingSpeakApi = {
  latest: (deviceId) =>
    api.get('/thingspeak/latest', { params: deviceId ? { deviceId } : {} }),
  status: () => api.get('/thingspeak/status'),
  sync: () => api.post('/thingspeak/sync'),
  history: (params) => api.get('/thingspeak/history', { params }),
};

export const alertApi = {
  list: (params) => api.get('/alerts', { params }),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
};

export const recommendationApi = {
  list: () => api.get('/recommendations'),
};

export const energyApi = {
  today: () => api.get('/energy/today'),
  month: () => api.get('/energy/month'),
  waste: () => api.get('/energy/waste'),
  rooms: () => api.get('/energy/rooms'),
};

export const maintenanceApi = {
  list: () => api.get('/maintenance'),
};

export const predictionApi = {
  get: (room, date) => api.get('/prediction', { params: { room, date } }),
};

export const mapApi = {
  list: () => api.get('/map'),
  room: (room) => api.get(`/map/${room}`),
};

export function getReportDownloadUrl(type, date) {
  return `/reports/pdf?type=${type}&date=${date}`;
}
```

---

## `src/services/socket.js`

```js
import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (socket) return socket;
  socket = io('http://localhost:5000', {
    transports: ['websocket', 'polling'],
  });
  socket.on('connect', () => console.log('[socket] connected', socket.id));
  socket.on('disconnect', (reason) => console.log('[socket] disconnected', reason));
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const subscribe = (event, callback) => {
  const s = connectSocket();
  s.on(event, callback);
  return () => s.off(event, callback);
};

export const emit = (event, payload) => {
  const s = connectSocket();
  s.emit(event, payload);
};
```

---

## `src/components/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
```

---

## `src/components/Loading.jsx`

```jsx
export default function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
    </div>
  );
}
```

---

## `src/components/ErrorMessage.jsx`

```jsx
export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
      <div className="flex items-center justify-between wrap gap-1">
        <span>{message}</span>
        {onRetry && (
          <button className="btn-secondary" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## `src/components/StatCard.jsx`

```jsx
export default function StatCard({ title, value, unit, icon, color = '#1f4e79' }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">
          {value ?? '--'}
          {unit && <span className="text-sm text-muted"> {unit}</span>}
        </div>
      </div>
    </div>
  );
}
```

---

## `src/components/Layout.jsx`

```jsx
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Cpu,
  Radio,
  Bell,
  Lightbulb,
  Zap,
  Wrench,
  TrendingUp,
  Map,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const links = [
  { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/devices', icon: <Cpu size={18} />, label: 'Devices' },
  { to: '/sensors', icon: <Radio size={18} />, label: 'Live Sensors' },
  { to: '/alerts', icon: <Bell size={18} />, label: 'Alerts' },
  { to: '/recommendations', icon: <Lightbulb size={18} />, label: 'Recommendations' },
  { to: '/energy', icon: <Zap size={18} />, label: 'Energy' },
  { to: '/maintenance', icon: <Wrench size={18} />, label: 'Maintenance' },
  { to: '/prediction', icon: <TrendingUp size={18} />, label: 'Prediction' },
  { to: '/map', icon: <Map size={18} />, label: 'Campus Map' },
  { to: '/reports', icon: <FileText size={18} />, label: 'Reports' },
];

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <div className={`topbar`}>
        <span className="topbar-title">Smart Campus</span>
        <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <span className="sidebar-brand">Smart Campus</span>
          <button className="sidebar-toggle" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="nav-link">
              {l.icon}
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {user?.name} <span className="text-muted">({user?.role})</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import LiveSensors from './pages/LiveSensors';
import Alerts from './pages/Alerts';
import Recommendations from './pages/Recommendations';
import Energy from './pages/Energy';
import Maintenance from './pages/Maintenance';
import Prediction from './pages/Prediction';
import CampusMap from './pages/CampusMap';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="devices/:id" element={<DeviceDetail />} />
            <Route path="sensors" element={<LiveSensors />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="energy" element={<Energy />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="prediction" element={<Prediction />} />
            <Route path="map" element={<CampusMap />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## `src/pages/Login.jsx`

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to Smart Campus Analytics</p>
        <ErrorMessage message={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
```

---

## `src/pages/Register.jsx`

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      if (data.token) {
        login(data);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p>Register for Smart Campus Analytics</p>
        <ErrorMessage message={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
```

---

## `src/pages/Dashboard.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Thermometer,
  Droplets,
  Sun,
  Users,
  Zap,
  Activity,
} from 'lucide-react';
import {
  dashboardApi,
} from '../services/api';
import { subscribe } from '../services/socket';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function Dashboard() {
  const [live, setLive] = useState([]);
  const [stats, setStats] = useState({});
  const [occupancy, setOccupancy] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topRooms, setTopRooms] = useState([]);
  const [underused, setUnderused] = useState([]);
  const [environment, setEnvironment] = useState({});
  const [energy, setEnergy] = useState({});
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [
        liveRes,
        statsRes,
        occRes,
        peakRes,
        topRes,
        underRes,
        envRes,
        energyRes,
        trendRes,
      ] = await Promise.all([
        dashboardApi.live(),
        dashboardApi.statistics(),
        dashboardApi.occupancy(),
        dashboardApi.peakHours(),
        dashboardApi.topRooms(),
        dashboardApi.underusedRooms(),
        dashboardApi.environment(),
        dashboardApi.energy(),
        dashboardApi.trends('daily'),
      ]);
      setLive(liveRes.data?.data || []);
      setStats(statsRes.data?.data || {});
      setOccupancy(occRes.data?.data || []);
      setPeakHours(peakRes.data?.data || []);
      setTopRooms(topRes.data?.data || []);
      setUnderused(underRes.data?.data || []);
      setEnvironment(envRes.data?.data || {});
      setEnergy(energyRes.data?.data || {});
      setTrends(trendRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub1 = subscribe('dashboard:update', () => load());
    const unsub2 = subscribe('sensor:new-reading', () => load());
    const unsub3 = subscribe('alert:new', () => load());
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [load]);

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <button className="btn-secondary" onClick={load}>
          Refresh
        </button>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="grid grid-4 mb-2">
        <StatCard
          title="Avg Temperature"
          value={stats.avgTemperature?.toFixed?.(1) ?? stats.avgTemperature}
          unit="°C"
          icon={<Thermometer size={22} />}
          color="#ef4444"
        />
        <StatCard
          title="Avg Humidity"
          value={stats.avgHumidity}
          unit="%"
          icon={<Droplets size={22} />}
          color="#3b82f6"
        />
        <StatCard
          title="Avg Light"
          value={stats.avgLight}
          unit="lx"
          icon={<Sun size={22} />}
          color="#eab308"
        />
        <StatCard
          title="Occupancy Rate"
          value={stats.occupancyRate}
          unit="%"
          icon={<Users size={22} />}
          color="#22c55e"
        />
      </div>

      <div className="grid grid-2 mb-2">
        <div className="card">
          <h3>Occupancy by Room</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="room" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupancyRate" fill="#1f4e79" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Peak Hours</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2 mb-2">
        <div className="card">
          <h3>Live Rooms ({live.length})</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Temp</th>
                  <th>Humidity</th>
                  <th>Light</th>
                  <th>Presence</th>
                </tr>
              </thead>
              <tbody>
                {live.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted">No live data</td>
                  </tr>
                )}
                {live.map((r) => (
                  <tr key={r.room}>
                    <td>{r.room}</td>
                    <td>{r.temperature ?? '--'}°C</td>
                    <td>{r.humidity ?? '--'}%</td>
                    <td>{r.light ?? '--'}</td>
                    <td>
                      <span className={`badge ${r.presence ? 'badge-online' : 'badge-info'}`}>
                        {r.presence ? 'Present' : 'Empty'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>Energy Summary</h3>
          <div className="grid grid-2">
            <StatCard
              title="Total Today"
              value={energy.totalToday ?? energy.total}
              unit="kWh"
              icon={<Zap size={20} />}
              color="#f59e0b"
            />
            <StatCard
              title="Waste Events"
              value={energy.wasteEvents ?? energy.totalWasteEvents}
              icon={<Activity size={20} />}
              color="#ef4444"
            />
          </div>
          <p className="text-sm text-muted mt-1">
            Data shape may vary by backend; this card falls back to common keys.
          </p>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <h3>Top Rooms</h3>
          <ul className="text-sm">
            {topRooms.length === 0 && <li className="text-muted">No data</li>}
            {topRooms.map((r, i) => (
              <li key={i} className="mb-1">
                {r.room ?? r.name ?? i + 1}: {r.value ?? r.occupancy ?? r.score ?? '--'}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Underused Rooms</h3>
          <ul className="text-sm">
            {underused.length === 0 && <li className="text-muted">No data</li>}
            {underused.map((r, i) => (
              <li key={i} className="mb-1">
                {r.room ?? r.name ?? i + 1}: {r.value ?? r.occupancy ?? r.score ?? '--'}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Environment Comfort</h3>
          <div className="text-sm">
            {Object.keys(environment).length === 0 ? (
              <span className="text-muted">No environment data</span>
            ) : (
              Object.entries(environment).map(([k, v]) => (
                <div key={k} className="mb-1">
                  <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : v}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {trends.length > 0 && (
        <div className="card mt-2">
          <h3>Trends</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="temperature" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## `src/pages/Devices.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { deviceApi } from '../services/api';
import { subscribe } from '../services/socket';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const emptyDevice = {
  deviceId: '',
  cardName: '',
  cardType: 'esp32',
  room: '',
  floor: 1,
  thingSpeakChannelId: '',
  thingSpeakApiKey: '',
};

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyDevice);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await deviceApi.list();
      setDevices(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub1 = subscribe('device:online', () => load());
    const unsub2 = subscribe('device:offline', () => load());
    const unsub3 = subscribe('device:heartbeat', () => load());
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyDevice);
    setModalOpen(true);
  };

  const openEdit = (device) => {
    setEditing(device);
    setForm({
      deviceId: device.deviceId,
      cardName: device.cardName,
      cardType: device.cardType,
      room: device.room,
      floor: device.floor,
      thingSpeakChannelId: device.thingSpeakChannelId || '',
      thingSpeakApiKey: device.thingSpeakApiKey || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await deviceApi.update(editing._id, form);
      } else {
        await deviceApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this device?')) return;
    try {
      await deviceApi.remove(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Devices</h1>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Device
        </button>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Name</th>
              <th>Room</th>
              <th>Floor</th>
              <th>Status</th>
              <th>Battery</th>
              <th>WiFi</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 && (
              <tr>
                <td colSpan={8} className="text-muted">No devices found</td>
              </tr>
            )}
            {devices.map((d) => (
              <tr key={d._id}>
                <td>{d.deviceId}</td>
                <td>
                  <Link to={`/devices/${d._id}`}>{d.cardName}</Link>
                </td>
                <td>{d.room}</td>
                <td>{d.floor}</td>
                <td>
                  <span className={`badge badge-${d.status === 'online' ? 'online' : 'offline'}`}>
                    {d.status}
                  </span>
                </td>
                <td>{d.battery ?? '--'}%</td>
                <td>{d.wifiSignal ?? '--'} dBm</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-secondary" onClick={() => openEdit(d)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(d._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editing ? 'Edit Device' : 'Add Device'}</h2>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Close</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Device ID</label>
                  <input required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Card Name</label>
                  <input required value={form.cardName} onChange={(e) => setForm({ ...form, cardName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Card Type</label>
                  <input value={form.cardType} onChange={(e) => setForm({ ...form, cardType: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <input required value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Floor</label>
                  <input type="number" required value={form.floor} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>ThingSpeak Channel ID</label>
                  <input value={form.thingSpeakChannelId} onChange={(e) => setForm({ ...form, thingSpeakChannelId: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>ThingSpeak API Key</label>
                  <input value={form.thingSpeakApiKey} onChange={(e) => setForm({ ...form, thingSpeakApiKey: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## `src/pages/DeviceDetail.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Power } from 'lucide-react';
import { deviceApi, thingSpeakApi } from '../services/api';
import { subscribe } from '../services/socket';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [led, setLed] = useState({ on: false, color: '#00ff00', brightness: 128 });
  const [config, setConfig] = useState({ thingSpeakChannelId: '', thingSpeakApiKey: '', thingSpeakFieldMapping: {} });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const listRes = await deviceApi.list();
      const found = (listRes.data?.data || []).find((d) => d._id === id);
      if (!found) {
        setError('Device not found');
        setLoading(false);
        return;
      }
      setDevice(found);

      const [ledRes, configRes, histRes] = await Promise.all([
        deviceApi.getLed(id).catch(() => ({ data: { data: found.ledStatus || {} } })),
        deviceApi.getConfig(id).catch(() => ({ data: { data: {} } })),
        thingSpeakApi.history({ deviceId: id, from: '', to: '' }).catch(() => ({ data: { data: [] } })),
      ]);

      const ledData = ledRes.data?.data || {};
      setLed({
        on: ledData.on ?? false,
        color: ledData.color || '#00ff00',
        brightness: ledData.brightness ?? 128,
      });

      const cfg = configRes.data?.data || {};
      setConfig({
        thingSpeakChannelId: cfg.thingSpeakChannelId || found.thingSpeakChannelId || '',
        thingSpeakApiKey: cfg.thingSpeakApiKey || found.thingSpeakApiKey || '',
        thingSpeakFieldMapping: cfg.thingSpeakFieldMapping || found.thingSpeakFieldMapping || {
          field1: 'temperature', field2: 'humidity', field3: 'light', field4: 'presence', field5: 'battery',
        },
      });

      setHistory(histRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load device');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const unsub1 = subscribe('device:led-update', (payload) => {
      if (payload.deviceId === device?.deviceId) setLed(payload.ledStatus);
    });
    const unsub2 = subscribe('device:config-updated', (payload) => {
      if (payload.deviceId === device?.deviceId) load();
    });
    const unsub3 = subscribe('device:heartbeat', () => load());
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [load, device?.deviceId]);

  const saveLed = async () => {
    try {
      await deviceApi.setLed(id, led);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'LED update failed');
    }
  };

  const saveConfig = async () => {
    try {
      await deviceApi.setConfig(id, config);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Config update failed');
    }
  };

  if (loading) return <Loading />;
  if (!device) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-secondary" onClick={() => navigate('/devices')}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="page-title">{device.cardName}</h1>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="grid grid-3 mb-2">
        <div className="card">
          <h3>Status</h3>
          <p>
            <span className={`badge badge-${device.status === 'online' ? 'online' : 'offline'}`}>
              {device.status}
            </span>
          </p>
          <p className="text-sm">Last seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : '--'}</p>
        </div>
        <div className="card">
          <h3>Battery & Signal</h3>
          <p>Battery: {device.battery ?? '--'}%</p>
          <p>WiFi: {device.wifiSignal ?? '--'} dBm</p>
          <p>Firmware: {device.firmware || '--'}</p>
        </div>
        <div className="card">
          <h3>ThingSpeak</h3>
          <p className="text-sm">Channel: {device.thingSpeakChannelId || '--'}</p>
          <p className="text-sm">API Key: {device.thingSpeakApiKey ? '••••••••' : '--'}</p>
        </div>
      </div>

      <div className="grid grid-2 mb-2">
        <div className="card">
          <h3>LED Control</h3>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={led.on}
                onChange={(e) => setLed({ ...led, on: e.target.checked })}
              />{' '}
              Power on
            </label>
          </div>
          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={led.color}
              onChange={(e) => setLed({ ...led, color: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Brightness ({led.brightness})</label>
            <input
              type="range"
              min={0}
              max={255}
              value={led.brightness}
              onChange={(e) => setLed({ ...led, brightness: Number(e.target.value) })}
            />
          </div>
          <button className="btn-primary" onClick={saveLed}>
            <Power size={16} /> Update LED
          </button>
        </div>

        <div className="card">
          <h3>Device Config</h3>
          <div className="form-group">
            <label>Channel ID</label>
            <input
              value={config.thingSpeakChannelId}
              onChange={(e) => setConfig({ ...config, thingSpeakChannelId: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>API Key</label>
            <input
              value={config.thingSpeakApiKey}
              onChange={(e) => setConfig({ ...config, thingSpeakApiKey: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Field Mapping (JSON)</label>
            <textarea
              rows={4}
              value={JSON.stringify(config.thingSpeakFieldMapping, null, 2)}
              onChange={(e) => {
                try {
                  setConfig({ ...config, thingSpeakFieldMapping: JSON.parse(e.target.value) });
                } catch {
                  // allow typing
                }
              }}
            />
          </div>
          <button className="btn-primary" onClick={saveConfig}>
            <Save size={16} /> Save Config
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Recent History</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Field1</th>
                <th>Field2</th>
                <th>Field3</th>
                <th>Field4</th>
                <th>Field5</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={6} className="text-muted">No history</td></tr>
              )}
              {history.slice(0, 20).map((h, i) => (
                <tr key={i}>
                  <td>{h.reading?.created_at ? new Date(h.reading.created_at).toLocaleString() : '--'}</td>
                  <td>{h.reading?.field1 ?? '--'}</td>
                  <td>{h.reading?.field2 ?? '--'}</td>
                  <td>{h.reading?.field3 ?? '--'}</td>
                  <td>{h.reading?.field4 ?? '--'}</td>
                  <td>{h.reading?.field5 ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## `src/pages/LiveSensors.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { thingSpeakApi } from '../services/api';
import { subscribe } from '../services/socket';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function LiveSensors() {
  const [latest, setLatest] = useState([]);
  const [status, setStatus] = useState({});
  const [filters, setFilters] = useState({ deviceId: '', from: '', to: '' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [latestRes, statusRes] = await Promise.all([
        thingSpeakApi.latest(),
        thingSpeakApi.status(),
      ]);
      setLatest(latestRes.data?.data || []);
      setStatus(statusRes.data?.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sensors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return subscribe('sensor:new-reading', () => load());
  }, [load]);

  const handleSync = async () => {
    try {
      await thingSpeakApi.sync();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Sync failed (admin only)');
    }
  };

  const handleHistory = async (e) => {
    e.preventDefault();
    try {
      const res = await thingSpeakApi.history(filters);
      setHistory(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'History load failed');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Live Sensors</h1>
        <div className="flex gap-1">
          <button className="btn-secondary" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn-primary" onClick={handleSync}>
            Sync ThingSpeak
          </button>
        </div>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="grid grid-3 mb-2">
        <div className="card">
          <h3>Connection</h3>
          <p>
            <span className={`badge badge-${status.connected ? 'online' : 'offline'}`}>
              {status.connected ? 'Connected' : 'Disconnected'}
            </span>
          </p>
        </div>
        <div className="card">
          <h3>Last Sync</h3>
          <p>{status.lastSync ? new Date(status.lastSync).toLocaleString() : '--'}</p>
        </div>
        <div className="card">
          <h3>Records Imported</h3>
          <p className="stat-value">{status.recordsImported ?? '--'}</p>
        </div>
      </div>

      <div className="card mb-2">
        <h3>Latest Readings</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Device</th>
                <th>Room</th>
                <th>Field1</th>
                <th>Field2</th>
                <th>Field3</th>
                <th>Field4</th>
                <th>Field5</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {latest.length === 0 && (
                <tr><td colSpan={8} className="text-muted">No readings</td></tr>
              )}
              {latest.map((r, i) => (
                <tr key={i}>
                  <td>{r.device}</td>
                  <td>{r.room}</td>
                  <td>{r.reading?.field1 ?? '--'}</td>
                  <td>{r.reading?.field2 ?? '--'}</td>
                  <td>{r.reading?.field3 ?? '--'}</td>
                  <td>{r.reading?.field4 ?? '--'}</td>
                  <td>{r.reading?.field5 ?? '--'}</td>
                  <td>{r.reading?.created_at ? new Date(r.reading.created_at).toLocaleString() : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>History Query</h3>
        <form onSubmit={handleHistory} className="grid grid-3">
          <div className="form-group">
            <label>Device ID</label>
            <input value={filters.deviceId} onChange={(e) => setFilters({ ...filters, deviceId: e.target.value })} />
          </div>
          <div className="form-group">
            <label>From</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="form-group">
            <label>To</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn-primary">Load History</button>
          </div>
        </form>

        {history.length > 0 && (
          <div className="table-wrap mt-2">
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Room</th>
                  <th>Field1</th>
                  <th>Field2</th>
                  <th>Field3</th>
                  <th>Field4</th>
                  <th>Field5</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={i}>
                    <td>{r.device}</td>
                    <td>{r.room}</td>
                    <td>{r.reading?.field1 ?? '--'}</td>
                    <td>{r.reading?.field2 ?? '--'}</td>
                    <td>{r.reading?.field3 ?? '--'}</td>
                    <td>{r.reading?.field4 ?? '--'}</td>
                    <td>{r.reading?.field5 ?? '--'}</td>
                    <td>{r.reading?.created_at ? new Date(r.reading.created_at).toLocaleString() : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## `src/pages/Alerts.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { alertApi } from '../services/api';
import { subscribe } from '../services/socket';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ type: '', room: '', severity: '', status: 'active' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await alertApi.list(params);
      setAlerts(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
    const unsub1 = subscribe('alert:new', () => load());
    const unsub2 = subscribe('alert:resolved', () => load());
    return () => {
      unsub1();
      unsub2();
    };
  }, [load]);

  const resolve = async (id) => {
    try {
      await alertApi.resolve(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Resolve failed');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Alerts</h1>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="card mb-2">
        <div className="grid grid-4">
          <div className="form-group">
            <label>Type</label>
            <input value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} placeholder="e.g. high_temperature" />
          </div>
          <div className="form-group">
            <label>Room</label>
            <input value={filters.room} onChange={(e) => setFilters({ ...filters, room: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Severity</label>
            <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        <button className="btn-primary mt-1" onClick={load}>Apply Filters</button>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Room</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Message</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 && (
              <tr><td colSpan={7} className="text-muted">No alerts</td></tr>
            )}
            {alerts.map((a) => (
              <tr key={a._id}>
                <td>{a.type}</td>
                <td>{a.room}</td>
                <td>
                  <span className={`badge badge-${a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'info'}`}>
                    {a.severity}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${a.status === 'active' ? 'active' : 'resolved'}`}>
                    {a.status}
                  </span>
                </td>
                <td>{a.message}</td>
                <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : '--'}</td>
                <td>
                  {a.status !== 'resolved' && (
                    <button className="btn-primary" onClick={() => resolve(a._id)}>
                      <CheckCircle size={14} /> Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## `src/pages/Recommendations.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react';
import { Lightbulb } from 'lucide-react';
import { recommendationApi } from '../services/api';
import { subscribe } from '../services/socket';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function Recommendations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await recommendationApi.list();
      setItems(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return subscribe('recommendation:new', () => load());
  }, [load]);

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Recommendations</h1>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="grid grid-2">
        {items.length === 0 && (
          <div className="card text-muted">No recommendations</div>
        )}
        {items.map((r) => (
          <div className="card" key={r._id}>
            <div className="flex items-center gap-1 mb-1">
              <Lightbulb size={18} color="#eab308" />
              <h3 style={{ margin: 0 }}>{r.type}</h3>
              <span className={`badge badge-${r.priority === 'high' ? 'critical' : r.priority === 'medium' ? 'warning' : 'info'}`}>
                {r.priority}
              </span>
              <span className={`badge badge-${r.status === 'active' ? 'active' : 'resolved'}`}>
                {r.status}
              </span>
            </div>
            <p>{r.message}</p>
            <p className="text-sm text-muted">Room: {r.room} • {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## `src/pages/Energy.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Zap, AlertTriangle } from 'lucide-react';
import { energyApi } from '../services/api';
import { subscribe } from '../services/socket';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import StatCard from '../components/StatCard';

const COLORS = ['#1f4e79', '#22c55e', '#eab308', '#ef4444', '#3b82f6'];

export default function Energy() {
  const [today, setToday] = useState([]);
  const [month, setMonth] = useState([]);
  const [waste, setWaste] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [tRes, mRes, wRes, rRes] = await Promise.all([
        energyApi.today(),
        energyApi.month(),
        energyApi.waste(),
        energyApi.rooms(),
      ]);
      setToday(tRes.data?.data || []);
      setMonth(mRes.data?.data || []);
      setWaste(wRes.data?.data || []);
      setRooms(rRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load energy data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return subscribe('energy:update', () => load());
  }, [load]);

  const totalToday = today.reduce((s, r) => s + (r.totalPower || 0), 0);
  const totalWaste = waste.reduce((s, r) => s + (r.wasteEvents || 0), 0);

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Energy</h1>
        <button className="btn-secondary" onClick={load}>Refresh</button>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="grid grid-4 mb-2">
        <StatCard title="Total Today" value={totalToday.toFixed?.(2) ?? totalToday} unit="kWh" icon={<Zap size={20} />} color="#f59e0b" />
        <StatCard title="Waste Events" value={totalWaste} icon={<AlertTriangle size={20} />} color="#ef4444" />
        <StatCard title="Rooms Tracked" value={rooms.length} icon={<Zap size={20} />} color="#1f4e79" />
        <StatCard title="Month Points" value={month.length} icon={<Zap size={20} />} color="#22c55e" />
      </div>

      <div className="grid grid-2 mb-2">
        <div className="card">
          <h3>Today's Consumption by Room</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={today}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="room" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalPower" fill="#1f4e79" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Waste Events</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waste}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="room" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="wasteEvents" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Room Share</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rooms} dataKey="totalPower" nameKey="room" outerRadius={100} label>
                  {rooms.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Monthly Trend</h3>
          <div className="table-wrap" style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Power</th>
                  <th>Waste</th>
                </tr>
              </thead>
              <tbody>
                {month.length === 0 && <tr><td colSpan={3} className="text-muted">No data</td></tr>}
                {month.map((r, i) => (
                  <tr key={i}>
                    <td>{r.room ?? r.date ?? i + 1}</td>
                    <td>{r.totalPower ?? '--'}</td>
                    <td>{r.wasteEvents ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## `src/pages/Maintenance.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react';
import { Wrench } from 'lucide-react';
import { maintenanceApi } from '../services/api';
import { subscribe } from '../services/socket';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function Maintenance() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await maintenanceApi.list();
      setItems(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return subscribe('maintenance:warning', () => load());
  }, [load]);

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Maintenance</h1>
        <button className="btn-secondary" onClick={load}>Refresh</button>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="grid grid-2">
        {items.length === 0 && <div className="card text-muted">No maintenance warnings</div>}
        {items.map((m, i) => (
          <div className="card" key={i}>
            <div className="flex items-center gap-1 mb-1">
              <Wrench size={18} />
              <h3 style={{ margin: 0 }}>{m.cardName || m.deviceId}</h3>
              <span className={`badge badge-${m.health === 'Critical' ? 'critical' : m.health === 'Warning' ? 'warning' : 'online'}`}>
                {m.health}
              </span>
            </div>
            <p className="text-sm text-muted">{m.recommendation}</p>
            <div className="text-sm">
              <p>Battery: {m.battery ?? '--'}% • WiFi: {m.wifiSignal ?? '--'} dBm</p>
              <p>Firmware: {m.firmware || '--'} • Last seen: {m.lastSeen ? new Date(m.lastSeen).toLocaleString() : '--'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## `src/pages/Prediction.jsx`

```jsx
import { useState } from 'react';
import { TrendingUp, Calendar, MapPin } from 'lucide-react';
import { predictionApi } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

export default function Prediction() {
  const today = new Date().toISOString().split('T')[0];
  const [room, setRoom] = useState('Library');
  const [date, setDate] = useState(today);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await predictionApi.get(room, date);
      setResult(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Occupancy Prediction</h1>
      </div>

      <ErrorMessage message={error} />

      <div className="card mb-2">
        <form onSubmit={handleSubmit} className="grid grid-3">
          <div className="form-group">
            <label><MapPin size={14} /> Room</label>
            <input required value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
          <div className="form-group">
            <label><Calendar size={14} /> Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              <TrendingUp size={16} /> {loading ? 'Predicting...' : 'Predict'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="grid grid-3">
          <div className="card">
            <h3>Expected Occupancy</h3>
            <div className="stat-value">{result.expectedOccupancy ?? '--'}%</div>
          </div>
          <div className="card">
            <h3>Confidence</h3>
            <div className="stat-value">{result.confidence ?? '--'}%</div>
          </div>
          <div className="card">
            <h3>Time</h3>
            <div className="stat-value">{result.time ?? '--'}</div>
            <p className="text-sm text-muted">{result.date}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## `src/pages/CampusMap.jsx`

```jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { mapApi } from '../services/api';
import { subscribe } from '../services/socket';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function CampusMap() {
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await mapApi.list();
      setRooms(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load map');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return subscribe('dashboard:update', () => load());
  }, [load]);

  const bounds = useMemo(() => {
    if (rooms.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    const xs = rooms.map((r) => r.x || 0);
    const ys = rooms.map((r) => r.y || 0);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [rooms]);

  const scale = (val, min, max) => {
    if (max === min) return 50;
    return ((val - min) / (max - min)) * 90 + 5;
  };

  const selectRoom = async (room) => {
    setSelected(room);
    try {
      const res = await mapApi.room(room.room);
      setDetail(res.data?.data || null);
    } catch {
      setDetail(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Campus Map</h1>
        <button className="btn-secondary" onClick={load}>Refresh</button>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="grid grid-2">
        <div className="card" style={{ minHeight: 520 }}>
          <h3>Room Layout</h3>
          <div className="map-container">
            {rooms.map((r) => {
              const left = scale(r.x, bounds.minX, bounds.maxX);
              const top = scale(r.y, bounds.minY, bounds.maxY);
              const occ = r.occupancy || 0;
              const color = occ > 80 ? '#fee2e2' : occ > 50 ? '#fef9c3' : '#dcfce7';
              return (
                <div
                  key={r.room}
                  className="map-room"
                  style={{ left: `${left}%`, top: `${top}%`, background: color }}
                  onClick={() => selectRoom(r)}
                >
                  <div className="map-room-name">{r.room}</div>
                  <div className="map-room-meta">{occ}% full</div>
                  <div className="map-room-meta">{r.temperature ?? '--'}°C</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3>Room Detail</h3>
          {selected ? (
            <div>
              <p><strong>{selected.room}</strong> (Floor {selected.floor})</p>
              <p>Capacity: {selected.capacity ?? '--'}</p>
              <p>Occupancy: {selected.occupancy ?? '--'}%</p>
              <p>Temperature: {selected.temperature ?? '--'}°C</p>
              <p>Humidity: {selected.humidity ?? '--'}%</p>
              {detail && (
                <div className="mt-2">
                  <hr />
                  <p>Sensor: <span className={`badge badge-${detail.sensor === 'online' ? 'online' : 'offline'}`}>{detail.sensor}</span></p>
                  <p>Occupancy: {detail.occupancy ?? '--'}%</p>
                  <p>Temp: {detail.temperature ?? '--'}°C</p>
                  <p>Humidity: {detail.humidity ?? '--'}%</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">Select a room on the map</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## `src/pages/Reports.jsx`

```jsx
import { useState } from 'react';
import { Download } from 'lucide-react';
import { getReportDownloadUrl } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

export default function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState('daily');
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('sc_token');
      const url = `http://localhost:5000${getReportDownloadUrl(type, date)}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Report download failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `report-${type}-${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      <ErrorMessage message={error} />

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label>Report Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleDownload} disabled={loading}>
          <Download size={16} /> {loading ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
}
```

---

## `src/pages/NotFound.jsx`

```jsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: '8rem' }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>Page not found</p>
      <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
        Go Home
      </Link>
    </div>
  );
}
```

---

## Run Instructions

1. **Backend must be running** on `http://localhost:5000`.
2. **Install dependencies:**
   ```bash
   cd front/smart-campus-frontend
   npm install
   ```
3. **Start the dev server:**
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` and log in.
5. **Build for production:**
   ```bash
   npm run build
   ```

The Vite proxy forwards `/api`, `/reports`, and `/socket.io` to the backend during development, so the frontend can use relative paths like `/api/auth/login`.
