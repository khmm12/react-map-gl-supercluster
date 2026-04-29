import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-map-gl-supercluster/maplibre': new URL('../src/exports-maplibre.ts', import.meta.url).pathname,
      'react-map-gl-supercluster/mapbox': new URL('../src/exports-mapbox.ts', import.meta.url).pathname,
      'react-map-gl-supercluster/mapbox-legacy': new URL('../src/exports-mapbox-legacy.ts', import.meta.url).pathname,
    },
  },
})
