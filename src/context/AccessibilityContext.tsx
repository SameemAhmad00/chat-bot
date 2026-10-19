import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'high-contrast';
export type FontScale = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  toggleTheme: () => void;
  cycleFontScale: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('persona_theme');
      return (saved as ThemeMode) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    try {
      const saved = localStorage.getItem('persona_font_scale');
      return (saved as FontScale) || 'normal';
    } catch {
      return 'normal';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('persona_theme', theme);
    } catch {
      // non-blocking
    }

    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'high-contrast');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);

    if (theme === 'light') {
      root.style.colorScheme = 'light';
      document.body.classList.remove('dark', 'high-contrast');
      document.body.classList.add('light');
    } else if (theme === 'high-contrast') {
      root.style.colorScheme = 'dark';
      document.body.classList.remove('dark', 'light');
      document.body.classList.add('high-contrast');
    } else {
      root.style.colorScheme = 'dark';
      document.body.classList.remove('light', 'high-contrast');
      document.body.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('persona_font_scale', fontScale);
    } catch {
      // non-blocking
    }

    const root = document.documentElement;
    root.classList.remove('scale-normal', 'scale-large', 'scale-xlarge');
    root.classList.add(`scale-${fontScale}`);
    root.setAttribute('data-font-scale', fontScale);

    // Direct root font-size assignment guarantees scaling across all rem-based Tailwind utilities
    if (fontScale === 'xlarge') {
      root.style.fontSize = '20px';
    } else if (fontScale === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [fontScale]);

  const toggleTheme = () => {
    if (theme === 'dark') setThemeState('light');
    else if (theme === 'light') setThemeState('high-contrast');
    else setThemeState('dark');
  };

  const cycleFontScale = () => {
    if (fontScale === 'normal') setFontScaleState('large');
    else if (fontScale === 'large') setFontScaleState('xlarge');
    else setFontScaleState('normal');
  };

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
        fontScale,
        setFontScale: setFontScaleState,
        toggleTheme,
        cycleFontScale,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
        
