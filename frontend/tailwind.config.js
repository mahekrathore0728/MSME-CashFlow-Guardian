/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#141816', // Main Background
          charcoal: '#141816',
        },
        forest: {
          DEFAULT: '#19231F', // Sidebar
          deep: '#19231F',
        },
        moss: {
          DEFAULT: '#202B25', // Cards
          dark: '#202B25',
          light: '#28362E',
        },
        olive: {
          DEFAULT: '#252F29', // Secondary Surface
          dark: '#252F29',
          muted: '#354239',   // Borders
        },
        sage: {
          DEFAULT: '#A3B89A', // Primary Accent
          green: '#A3B89A',
          emerald: '#8DB69A', // Success
          hover: '#92A888',
        },
        champagne: {
          DEFAULT: '#C6A96B', // Secondary Accent / Gold
          gold: '#C6A96B',
          light: '#D9C189',
        },
        ivory: {
          DEFAULT: '#F1F0E8', // Main Text
          warm: '#F1F0E8',
        },
        gray: {
          soft: '#A5ADA5',    // Secondary Text
          muted: '#717C71',
        },
        crimson: {
          DEFAULT: '#D66B70', // Danger / Critical Risk
          muted: '#D66B70',
        },
        amber: {
          DEFAULT: '#D9AD68', // Warning / Overdue
          soft: '#D9AD68',
        },
        emerald: {
          DEFAULT: '#8DB69A', // Success
          sage: '#8DB69A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'modal': '0 20px 40px -4px rgba(0, 0, 0, 0.7)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
