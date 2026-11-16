/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Graphite Noir Core Palette
        graphite: {
          DEFAULT: '#111214', // Main Background
          main: '#111214',
          sidebar: '#17191C',
          card: '#202327',
          surface: '#292D32',
          border: '#383D43',
          accent: '#8299AD',
          silver: '#B8BEC5',
          text: '#F1F2F3',
          muted: '#A0A5AC',
        },
        // Unified palette tokens (replaces previous green-heavy tones with matte black & graphite)
        midnight: {
          DEFAULT: '#111214', // Main Background
          charcoal: '#111214',
        },
        forest: {
          DEFAULT: '#17191C', // Sidebar
          deep: '#17191C',
        },
        moss: {
          DEFAULT: '#202327', // Card Background
          dark: '#202327',
          light: '#25292E',
        },
        olive: {
          DEFAULT: '#292D32', // Secondary Surface
          dark: '#202327',
          muted: '#383D43',   // Subtle Border
        },
        sage: {
          DEFAULT: '#8299AD', // Primary Accent (Steel Blue / Slate)
          green: '#8299AD',
          emerald: '#8DA995', // Success
          hover: '#94ABBF',
        },
        champagne: {
          DEFAULT: '#B8BEC5', // Secondary Accent (Cool Silver / Slate Light)
          gold: '#C9A875',    // Warning
          light: '#D0D5DB',
        },
        ivory: {
          DEFAULT: '#F1F2F3', // Primary Text (Crisp near-white)
          warm: '#F1F2F3',
        },
        gray: {
          soft: '#A0A5AC',    // Secondary Text (Slate Grey)
          muted: '#6C727A',
        },
        crimson: {
          DEFAULT: '#C77F83', // Danger
          muted: '#C77F83',
        },
        amber: {
          DEFAULT: '#C9A875', // Warning
          soft: '#C9A875',
        },
        emerald: {
          DEFAULT: '#8DA995', // Success
          sage: '#8DA995',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 10px -1px rgba(0, 0, 0, 0.45)',
        'modal': '0 16px 36px -4px rgba(0, 0, 0, 0.65)',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
