/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace']
            },
            colors: {
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81'
                },
                surface: {
                    800: '#1e293b',
                    900: '#0f172a'
                }
            }
        }
    },
    plugins: []
}
