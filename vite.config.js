import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Rewrites /puzzle-N and /puzzle-N/ to /puzzle-N/index.html so the clean URL people
// actually type/share resolves to the real static page, not a 404 (appType: 'mpa' below
// stops Vite from masking it as the SPA, but doesn't add directory-index resolution itself).
function puzzlePageRewrite() {
  const rewrite = (req, _res, next) => {
    const [pathname, search] = (req.url || '').split('?')
    const match = pathname.match(/^\/(puzzle-\d+)\/?$/)
    if (match) {
      req.url = `/${match[1]}/index.html${search ? `?${search}` : ''}`
    }
    next()
  }
  return {
    name: 'puzzle-page-rewrite',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

// Production domain, reached through a reverse proxy in front of `vite preview`/`vite dev` —
// Vite blocks requests whose Host header isn't explicitly allowlisted (DNS-rebinding guard).
const allowedHosts = ['salagrillit.serveriry.fi']

export default defineConfig({
  // This site isn't a client-routed SPA — puzzle pages are separate static HTML files
  // under public/puzzle-N/. The default 'spa' appType makes Vite silently serve the root
  // index.html for any extensionless URL (e.g. /puzzle-1 or /puzzle-1/), masking those
  // pages. 'mpa' disables that fallback so each path resolves to its real file.
  appType: 'mpa',
  plugins: [vue(), puzzlePageRewrite()],
  server: {
    allowedHosts,
  },
  preview: {
    allowedHosts,
  },
})
