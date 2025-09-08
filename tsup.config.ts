import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/admin/MapPointField.tsx', 'src/admin/ClientMapPointField.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  splitting: false,
  external: [
    'payload',
    'react',
    'react-dom',
    'mapbox-gl',
  ],
  loader: {
    '.css': 'copy',
  },
})
