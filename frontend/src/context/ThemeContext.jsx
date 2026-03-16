import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const overlayRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback((e) => {
    const next = theme === 'light' ? 'dark' : 'light';

    // Get click coordinates for the circular animation origin
    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? window.innerHeight / 2;

    // Calculate the maximum radius needed to cover the entire viewport
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Check if View Transitions API is supported
    if (document.startViewTransition) {
      document.documentElement.style.setProperty('--tx', `${x}px`);
      document.documentElement.style.setProperty('--ty', `${y}px`);
      document.documentElement.style.setProperty('--max-radius', `${maxRadius}px`);

      const transition = document.startViewTransition(() => {
        document.documentElement.setAttribute('data-theme', next);
        setTheme(next);
      });
    } else {
      // Fallback: create overlay manually
      const overlay = document.createElement('div');
      overlay.className = 'theme-transition-overlay';
      overlay.style.setProperty('--tx', `${x}px`);
      overlay.style.setProperty('--ty', `${y}px`);
      overlay.style.setProperty('--max-radius', `${maxRadius}px`);

      const nextColors = next === 'dark'
        ? { bg: '#0f1117' }
        : { bg: '#f8f9fc' };
      overlay.style.background = nextColors.bg;

      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });

      overlay.addEventListener('animationend', () => {
        document.documentElement.setAttribute('data-theme', next);
        setTheme(next);
        overlay.remove();
      });
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
