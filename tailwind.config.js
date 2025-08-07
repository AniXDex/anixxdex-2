/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Exact colors from original design
        background: '#000000',
        surface: '#121212',
        'surface-light': 'rgba(255, 255, 255, 0.05)',
        accent: '#0099ff',
        'accent-hover': '#0088cc',
        'text-primary': '#ffffff',
        'text-secondary': '#b3b3b3',
        'text-muted': '#888888',
        'aurora-start': '#000000',
        'aurora-mid': '#111111',
        'aurora-end': '#000000',
        'player-bg': 'rgba(24, 24, 24, 0.95)',
        'progress-bar': '#4f4f4f',
        'progress-fill': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'page-title': '32px',
        'section-title': '24px',
        'card-title': '14px',
        'card-subtitle': '12px',
        'player-track': '14px',
        'player-artist': '12px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      animation: {
        'aurora': 'aurora 20s ease-in-out infinite',
        'vinyl-spin': 'vinylSpin 3s linear infinite',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        vinylSpin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      backdropBlur: {
        '20': '20px',
        '25': '25px',
        '40': '40px',
      },
      gridTemplateColumns: {
        'sidebar-main': '240px 1fr',
        'player-desktop': '300px 1fr 200px',
      },
      gridTemplateAreas: {
        'app-layout': '"sidebar main" "player player"',
        'app-no-player': '"sidebar main"',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}