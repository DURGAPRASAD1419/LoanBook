import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// cleanup leftover Three.js DOM (if earlier runs created a portal container)
if (typeof document !== 'undefined') {
  const leftover = document.getElementById('three-ui-root');
  if (leftover && leftover.parentNode) leftover.parentNode.removeChild(leftover);
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
