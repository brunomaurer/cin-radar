import { useState, useEffect, useRef } from 'react';

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return typeof initial === 'function' ? initial() : initial;
      return JSON.parse(raw);
    } catch {
      return typeof initial === 'function' ? initial() : initial;
    }
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);

  return [value, setValue];
}
