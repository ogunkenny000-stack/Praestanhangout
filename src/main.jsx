import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname.replace(/\/$/, '') === '/organiser' ? <AdminDashboard /> : <App />}
  </React.StrictMode>
);
