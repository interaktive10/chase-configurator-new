import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'
import os from 'os'

const isVercel = process.env.VERCEL === '1'

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return undefined;
}

export default defineConfig({
  plugins: [
    react(),
    !isVercel && cssInjectedByJs(),
  ].filter(Boolean),
  define: {
    __LOCAL_IP__: JSON.stringify(getLocalIP())
  },
  build: isVercel ? {
    outDir: 'dist',
  } : {
    lib: {
      entry: 'src/web-component.tsx',
      name: 'ChaseConfigurator',
      fileName: 'chase-configurator',
      formats: ['iife'],
    },
    outDir: 'dist',
    rollupOptions: {
      output: { inlineDynamicImports: true }
    }
  },
  server: { port: 5173, host: true, open: true }
})
