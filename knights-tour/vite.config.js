import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: 'https://github.com/Dei1400/Proyecto1_Analisis.git',   //repo en GitHub
  plugins: [react()],
})
