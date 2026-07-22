

import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';
import { AuthProvider } from './context/AuthContext.jsx';

// ✅ Set global defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_URL;

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
  ,
)
