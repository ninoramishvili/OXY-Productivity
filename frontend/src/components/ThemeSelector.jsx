import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Heart, ChevronDown } from 'lucide-react';
import './ThemeSelector.css';

function ThemeSelector() {
  const { theme, setSpecificTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    {
      id: 'dark',
      name: 'Dark Mode',
      icon: Moon,
      description: 'Night focus',
      preview: 'linear-gradient(135deg, #0a0e27, #2a2f4a)'
    },
    {
      id: 'light',
      name: 'Light Mode',
      icon: Sun,
      description: 'Day work',
      preview: 'linear-gradient(135deg, #f0f4f8, #cbd5e1)'
    },
    {
      id: 'oxy',
      name: 'OXY Mode',
      icon: Heart,
      description: 'Calm & trust',
      preview: '#fff5f0'
    }
  ];

  const currentTheme = themes.find(t => t.id === theme);
  const CurrentIcon = currentTheme?.icon || Moon;

  const handleThemeSelect = (themeId) => {
    setSpecificTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="theme-selector" ref={dropdownRef}>
      <button 
        className="theme-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
      >
        <CurrentIcon size={18} />
        <span className="theme-name">{currentTheme?.name}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === theme;
            
            return (
              <button
                key={t.id}
                className={`theme-option ${isActive ? 'active' : ''}`}
                onClick={() => handleThemeSelect(t.id)}
              >
                <div 
                  className="theme-preview" 
                  style={{ background: t.preview }}
                />
                <div className="theme-info">
                  <div className="theme-option-name">
                    <Icon size={16} />
                    <span>{t.name}</span>
                  </div>
                  <span className="theme-description">{t.description}</span>
                </div>
                {isActive && (
                  <div className="theme-checkmark">✓</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThemeSelector;

