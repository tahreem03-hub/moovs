

import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';
import { AuthProvider } from './context/AuthContext.jsx';

axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
  ,
)
