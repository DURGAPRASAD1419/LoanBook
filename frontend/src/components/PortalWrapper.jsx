import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PortalWrapper({ children }) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const el = document.getElementById('three-ui-root');
    if (el) setTarget(el);
    // If the element doesn't exist yet, poll until it's created (short-lived)
    let mounted = true;
    if (!el) {
      const id = setInterval(() => {
        const e = document.getElementById('three-ui-root');
        if (e && mounted) {
          setTarget(e);
          clearInterval(id);
        }
      }, 100);
      return () => { mounted = false; clearInterval(id); };
    }
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}
