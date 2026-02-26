import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Adjust this if your GitHub repo name changes or you use a custom domain
  base: '/1XL-Infra-Task-Project-Management-System-Software/',
  plugins: [react(), tailwindcss()],
})
