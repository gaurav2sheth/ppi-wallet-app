import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

const SHARED_DATA_PATH = path.resolve(__dirname, '../.shared-data/wallet-events.json')

function walletSyncPlugin() {
  return {
    name: 'wallet-sync',
    configureServer(server: any) {
      // POST /api/sync - wallet app pushes events here
      server.middlewares.use('/api/sync', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              const event = JSON.parse(body)
              let data = { users: [] as any[], transactions: [] as any[], balances: {} as any }
              try { data = JSON.parse(fs.readFileSync(SHARED_DATA_PATH, 'utf-8')) } catch {}

              if (event.type === 'user_login') {
                const existing = data.users.findIndex((u: any) => u.wallet_id === event.data.wallet_id)
                if (existing >= 0) data.users[existing] = { ...data.users[existing], ...event.data, updated_at: new Date().toISOString() }
                else data.users.push({ ...event.data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              } else if (event.type === 'transaction') {
                data.transactions.unshift({ ...event.data, synced_at: new Date().toISOString() })
                if (data.transactions.length > 500) data.transactions = data.transactions.slice(0, 500)
              } else if (event.type === 'balance_update') {
                data.balances[event.data.wallet_id] = event.data
              } else if (event.type === 'kyc_update') {
                const u = data.users.find((u: any) => u.wallet_id === event.data.wallet_id)
                if (u) { u.kyc_state = event.data.kyc_state; u.kyc_tier = event.data.kyc_tier; u.updated_at = new Date().toISOString() }
              }

              fs.writeFileSync(SHARED_DATA_PATH, JSON.stringify(data, null, 2))
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
          })
        } else {
          res.writeHead(405)
          res.end()
        }
      })

      // GET /api/sync - read current shared data (for debugging)
      server.middlewares.use('/api/sync-status', (_req: any, res: any) => {
        try {
          const data = fs.readFileSync(SHARED_DATA_PATH, 'utf-8')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(data)
        } catch {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end('{"users":[],"transactions":[],"balances":{}}')
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), walletSyncPlugin()],
  base: '/ppi-wallet-app/',
  server: {
    port: 5173,
  },
})
