import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { Analytics } from "@vercel/analytics/next"
import './index.css'
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById("root")!).render(
  // Wrap your App component with BrowserRouter
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
