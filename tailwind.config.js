/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Day palette "Шалфей" via CSS channels in styles/common.css;
                // the .dark class swaps in the stock values.
                white: 'rgb(var(--iv-white) / <alpha-value>)',
                gray: {
                    50: 'rgb(var(--iv-gray-50) / <alpha-value>)',
                    100: 'rgb(var(--iv-gray-100) / <alpha-value>)',
                    200: 'rgb(var(--iv-gray-200) / <alpha-value>)',
                    300: 'rgb(var(--iv-gray-300) / <alpha-value>)',
                    400: 'rgb(var(--iv-gray-400) / <alpha-value>)',
                    500: 'rgb(var(--iv-gray-500) / <alpha-value>)',
                    600: 'rgb(var(--iv-gray-600) / <alpha-value>)',
                    700: 'rgb(var(--iv-gray-700) / <alpha-value>)',
                    800: 'rgb(var(--iv-gray-800) / <alpha-value>)',
                    900: 'rgb(var(--iv-gray-900) / <alpha-value>)',
                    950: '#030712',
                },
                'inter-verse': {
                    green: 'rgb(var(--iv-green) / <alpha-value>)',
                    'green-light': 'rgb(var(--iv-green-light) / <alpha-value>)',
                    tint: 'var(--iv-tint)',
                    'purple-dark': '#c084fc',
                    'purple-darker': '#9333ea',
                },
                'iv-dark': {
                    // Night palette from design-review/interverse-redesign.html.
                    bg: '#14161B',
                    surface: '#1D2027',
                    line: '#343843',
                    tint: '#30263F',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            maxWidth: {
                'content': '1280px',
                'form': '640px',
            },
            boxShadow: {
                'iv-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'iv-md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
                'iv-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
                'iv-xl': '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
            },
            transitionTimingFunction: {
                'iv': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            animation: {
                'fade-in': 'fadeIn 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                'slide-up': 'slideUp 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                'gradient-breathe': 'gradientBreathe 6s ease infinite',
                'shimmer': 'shimmer 1.5s ease-in-out infinite',
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
                gradientBreathe: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundSize: {
                '300%': '300% 300%',
            },
        },
    },
    plugins: [],
}
