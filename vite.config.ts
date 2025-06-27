import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    allowedHosts: ["taskflowfrontend-vvba.onrender.com"],
  },
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis", // Fix for "React is not defined"
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // Optional: avoid warning for large chunks
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Splitting out common libraries to reduce main bundle size
          react: ["react", "react-dom"],
          emotion: ["@emotion/react", "@emotion/styled"],
        },
      },
    },
  },
}));
