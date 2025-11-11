import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      'chordkeeper.innapses.com',
      'localhost',
      '.innapses.com', // permite todos subdomínios
    ],
    proxy: {
      // encaminha /api para o serviço Rails
      '/api': {
        // se Vite roda no host (local), use http://localhost:3000
        // se Vite roda no container e Rails está em outro container use http://web:3000
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
