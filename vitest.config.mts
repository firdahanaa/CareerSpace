import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    watch: false,
    server: {
      deps: {
        inline: [/@auth/, /next-auth/],
      },
    },
  },
  ssr: {
    noExternal: ['next-auth', '@auth/core'],
  },
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: path.resolve(import.meta.dirname, './src/$1') },
      { find: /^next\/server$/, replacement: path.resolve(import.meta.dirname, './node_modules/next/server.js') },
    ],
  },
})
