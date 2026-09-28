import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Mêmes en-têtes de sécurité en aperçu local (`npm run preview`) qu'en production sur Vercel.
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf-8'))
const securityHeaders = Object.fromEntries(
  vercel.headers.find((rule) => rule.source === '/(.*)').headers.map(({ key, value }) => [key, value]),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: { headers: securityHeaders },
})
