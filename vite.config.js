import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'

export default defineConfig({
  build: { rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), admin: resolve(import.meta.dirname, 'admin/index.html') } } },
  plugins: [{ name: 'admin-seed-data', generateBundle() { this.emitFile({ type: 'asset', fileName: 'admin/flights.json', source: readFileSync(resolve(import.meta.dirname, 'admin/flights.json')) }) } }]
})
