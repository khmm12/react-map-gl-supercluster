import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'exports-mapbox': 'src/exports-mapbox.ts',
    'exports-maplibre': 'src/exports-maplibre.ts',
    'exports-mapbox-legacy': 'src/exports-mapbox-legacy.ts',
  },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2020',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  dts: { build: true },
  clean: true,
  publint: true,
  attw: { profile: 'esm-only' },
})
