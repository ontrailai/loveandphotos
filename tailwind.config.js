/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors inspired by Lily & Lime
        blush: {
          50: '#fdf2f4',
          100: '#fce8ec',
          200: '#fad2db',
          300: '#f6abbe',
          400: '#ef7895',
          500: '#e54d73',
          600: '#d22a57',
          700: '#b01e45',
          800: '#931c3c',
          900: '#7d1a36',
        },
        sage: {
          50: '#f6f7f6',
          100: '#e3e6e2',
          200: '#c6cdc5',
          300: '#a2ada1',
          400: '#7e8d7c',
          500: '#647462',
          600: '#4f5b4d',
          700: '#404a3f',
          800: '#353d35',
          900: '#2e342e',
        },
        dusty: {
          50: '#f4f6f7',
          100: '#e4e7ea',
          200: '#cbd1d7',
          300: '#a7b0bb',
          400: '#7b8797',
          500: '#606b7c',
          600: '#525969',
          700: '#464b57',
          800: '#3e424a',
          900: '#363941',
        },
        cream: {
          50: '#fdfbf7',
          100: '#fcf8f3',
          200: '#f8ede4',
          300: '#f3ddc8',
          400: '#ecc7a7',
          500: '#e3ad87',
          600: '#d6906a',
          700: '#b47257',
          800: '#935c4a',
          900: '#794d3f',
        }
      },
      fontFamily: {
        'display': ['DM Sans', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
}
