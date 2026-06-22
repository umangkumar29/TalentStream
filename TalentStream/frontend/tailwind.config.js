/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif']
      },
      colors: {
        "on-secondary": "#213145",
        "surface-bright": "#31394d",
        "tertiary": "#4edea3",
        "on-secondary-fixed-variant": "#38485d",
        "on-primary": "#002388",
        "on-background": "#dae2fd",
        "inverse-on-surface": "#283044",
        "secondary-container": "#3a4a5f",
        "primary-fixed": "#dde1ff",
        "on-secondary-fixed": "#0b1c30",
        "primary-container": "#2e5bff",
        "on-tertiary-fixed-variant": "#005236",
        "on-secondary-container": "#a9bad3",
        "on-error": "#690005",
        "primary-fixed-dim": "#b8c3ff",
        "on-tertiary": "#003824",
        "inverse-surface": "#dae2fd",
        "secondary": "#b7c8e1",
        "outline-variant": "#434656",
        "tertiary-container": "#007d55",
        "on-surface-variant": "#c4c5d9",
        "on-primary-container": "#efefff",
        "surface-container-low": "#131b2e",
        "surface-dim": "#0b1326",
        "secondary-fixed": "#d3e4fe",
        "error": "#ffb4ab",
        "surface-tint": "#b8c3ff",
        "on-tertiary-fixed": "#002113",
        "on-primary-fixed": "#001356",
        "surface": "#0b1326",
        "surface-container-highest": "#2d3449",
        "on-tertiary-container": "#bdffdb",
        "tertiary-fixed": "#6ffbbe",
        "surface-variant": "#2d3449",
        "on-surface": "#dae2fd",
        "inverse-primary": "#124af0",
        "surface-container": "#171f33",
        "primary": "#b8c3ff",
        "secondary-fixed-dim": "#b7c8e1",
        "outline": "#8e90a2",
        "on-error-container": "#ffdad6",
        "surface-container-lowest": "#060e20",
        "surface-container-high": "#222a3d",
        "background": "#0b1326",
        "on-primary-fixed-variant": "#0035be",
        "error-container": "#93000a",
        "tertiary-fixed-dim": "#4edea3",
        talentstream: {
          bg: 'var(--talentstream-bg)',
          surface: 'var(--talentstream-surface)',
          'surface-low': 'var(--talentstream-surface-low)',
          'surface-high': 'var(--talentstream-surface-high)',
          'surface-highest': 'var(--talentstream-surface-highest)',
          primary: 'var(--talentstream-primary)',
          'primary-container': 'var(--talentstream-primary-container)',
          tertiary: 'var(--talentstream-tertiary)',
          'tertiary-container': 'var(--talentstream-tertiary-container)',
          error: 'var(--talentstream-error)',
          'on-surface': 'var(--talentstream-on-surface)',
          'on-surface-variant': 'var(--talentstream-on-surface-variant)',
          outline: 'var(--talentstream-outline)',
          'outline-variant': 'var(--talentstream-outline-variant)',
        }
      },
      backgroundImage: {
        'gradient-aura': 'linear-gradient(135deg, rgba(184, 195, 255, 0.8) 0%, rgba(46, 91, 255, 0.8) 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(34, 42, 61, 0.6) 0%, rgba(11, 19, 38, 0.6) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'xl': '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(99, 102, 241, 0.4)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite',
        'glow': 'glow 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        glow: {
          '0%, 100%': { textShadow: '0 0 10px rgba(184, 195, 255, 0.5)' },
          '50%': { textShadow: '0 0 20px rgba(184, 195, 255, 0.8)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        scan: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(400px)' },
        }
      }
    },
  },
  plugins: [],
}

