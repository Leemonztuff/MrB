'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Theme = 'dark' | 'light';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10 rounded-full glass hover:bg-primary/10"
      >
        <Moon className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-10 w-10 rounded-full glass hover:bg-primary/10 transition-all duration-300 ${
        isAnimating ? 'scale-110' : 'scale-100'
      }`}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Cambiar a modo claro ☀️' : 'Cambiar a modo oscuro 🌙'}
    >
      <div className="relative">
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-400 transition-transform duration-300" />
        )}
        {isAnimating && (
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary animate-pulse" />
        )}
      </div>
    </Button>
  );
}
