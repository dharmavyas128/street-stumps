import { useState, useEffect } from 'react';

export function useTheme() {
  const [isLight, setIsLight] = useState(
    () => document.documentElement.classList.contains('light')
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsLight(el.classList.contains('light'));
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isLight;
}
