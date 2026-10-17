import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// vite production config
export default defineConfig(({ mode }) => ({
    plugins: [react()],
    build: { manifest: true },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: loadEnv(mode, process.cwd()).VITE_PROXY_TARGET || 'http://backend:8080',
                changeOrigin: true,
            },
        },
    },
}))
