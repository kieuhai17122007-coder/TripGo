import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { readFileSync, readdirSync } from 'node:fs'

export default defineConfig({
  build: { rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), admin: resolve(import.meta.dirname, 'admin/index.html'), ...Object.fromEntries(readdirSync(resolve(import.meta.dirname, 'src/pages')).filter(name => name.endsWith('.html')).map(name => ['page-'+name.replace('.html',''), resolve(import.meta.dirname, 'src/pages', name)])) } } },
  plugins: [{ name: 'admin-seed-data', generateBundle() { this.emitFile({ type: 'asset', fileName: 'admin/tailwind.js', source: readFileSync(resolve(import.meta.dirname, 'admin/tailwind.js')) }); this.emitFile({ type: 'asset', fileName: 'admin/flights.json', source: readFileSync(resolve(import.meta.dirname, 'admin/flights.json')) }) } }]
})
