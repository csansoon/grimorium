import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function getGitBranchName(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    try {
      const headPath = resolve(process.cwd(), '..', '.git', 'HEAD')
      const headRef = readFileSync(headPath, 'utf8').trim()
      if (headRef.startsWith('ref: ')) {
        return headRef.replace('ref: refs/heads/', '').replace('ref: ', '')
      }
    } catch {
      // Fall through to unknown.
    }
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_BRANCH__: JSON.stringify(getGitBranchName()),
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Grimorium',
        short_name: 'Grimorium',
        description: 'A companion app for Blood on the Clocktower that handles the clockwork so you can focus on the story.',
        theme_color: '#0D0D0D',
        background_color: '#0D0D0D',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
