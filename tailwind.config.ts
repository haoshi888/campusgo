import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        canvas: '#F5F6FB',
        violet: {
          50: '#F2F0FF',
          100: '#E9E5FF',
          200: '#D7D0FF',
          300: '#B9ADFF',
          400: '#9484FF',
          500: '#735CFF',
          600: '#5E46F0',
          700: '#4D36CF',
          800: '#402FA8',
          900: '#372A84'
        },
        mint: {
          50: '#F0FFF8',
          100: '#D9FFEB',
          200: '#AFF9D3',
          300: '#78EEB5',
          400: '#3EDC96',
          500: '#17C77D'
        },
        coral: {
          400: '#FF718A',
          500: '#FF4F70',
          600: '#E83C5D'
        }
      },
      fontFamily: {
        sans: ['"HarmonyOS Sans SC"', '"MiSans"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        display: ['"HarmonyOS Sans SC"', '"MiSans"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif']
      },
      boxShadow: {
        card: '0 12px 36px rgba(28, 32, 58, 0.07)',
        float: '0 18px 50px rgba(92, 72, 211, 0.20)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.22,1,.36,1) both',
        'pop-in': 'pop-in .25s ease-out both',
        'float-slow': 'float-slow 4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite'
      }
    }
  },
  plugins: []
} satisfies Config
