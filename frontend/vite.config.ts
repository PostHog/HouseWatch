import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:8000",
                secure: false,
                ws: true,
            },
            "/admin/": {
                target: "http://127.0.0.1:8000",
                secure: false,
                ws: true,
            },
            "/logout": {
                target: "http://127.0.0.1:8000",
                secure: false,
                ws: true,
            },
        },
    },
    base: process.env.NODE_ENV === "production" ? "/webapp/" : "/",
})
