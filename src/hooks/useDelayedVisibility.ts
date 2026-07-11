import { useEffect, useState } from "react";

export function useDelayedVisibility(visible: boolean, delay = 180) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    const timer = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay, visible]);

  return visible && show;
}
