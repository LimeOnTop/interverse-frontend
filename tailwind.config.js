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
                'inter-verse': {
                    green: '#013220',
                    'green-light': '#014d30',
                    'purple-dark': '#c084fc',
                    'purple-darker': '#9333ea',
                },
                'iv-dark': {
                    bg: '#2F2F2F',
                    surface: '#4A4A4A',
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
