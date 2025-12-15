import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Correção para ReferenceError: ambiente não está definido
const ambiente = process.env 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Garante que o código de front-end possa acessar as chaves Vercel
    'process.env.API_KEY': JSON.stringify(ambiente.VITE_GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(ambiente.VITE_GEMINI_API_KEY)
  },
})
