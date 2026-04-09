import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

const SHARED_DATA_PATH = path.resolve(__dirname, '../.shared-data/wallet-events.json')

// Load .env for server-side middleware (API key stays server-side only)
function loadEnvFile(): Record<string, string> {
  const envPaths = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '../Project Folder PPI/.env'),
  ]
  const vars: Record<string, string> = {}
  for (const p of envPaths) {
    try {
      const content = fs.readFileSync(p, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
      }
    } catch { /* skip */ }
  }
  return vars
}

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

      // POST /api/chat — Natural language AI chat (server-side, agentic tool loop)
      server.middlewares.use('/api/chat', (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { message } = JSON.parse(body)
            if (!message || typeof message !== 'string') {
              res.writeHead(400)
              res.end(JSON.stringify({ error: 'Message is required' }))
              return
            }

            const env = loadEnvFile()
            const apiKey = process.env.ANTHROPIC_API_KEY || env['ANTHROPIC_API_KEY'] || ''
            if (!apiKey || apiKey === 'your_key_here') {
              res.writeHead(500)
              res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured.' }))
              return
            }

            const { handleChat } = await import('../mcp/chat-handler.js')
            const reply = await handleChat(message, apiKey, 'user')
            res.writeHead(200)
            res.end(JSON.stringify({ reply }))
          } catch (err: any) {
            console.error('[Chat] Error:', err?.message || err)
            res.writeHead(502)
            res.end(JSON.stringify({ error: `Chat error: ${err?.message || 'Unknown error'}` }))
          }
        })
      })

      // POST /api/summarise-transactions — Claude AI transaction summariser (server-side)
      server.middlewares.use('/api/summarise-transactions', (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { transactions } = JSON.parse(body)
            if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
              res.writeHead(400)
              res.end(JSON.stringify({ error: 'No transactions provided' }))
              return
            }

            const env = loadEnvFile()
            const apiKey = process.env.ANTHROPIC_API_KEY || env['ANTHROPIC_API_KEY'] || ''
            if (!apiKey || apiKey === 'your_key_here') {
              res.writeHead(500)
              res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured. Set it in the .env file.' }))
              return
            }

            const formatted = transactions.map((t: any, i: number) => {
              const date = new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              const amount = '₹' + (Number(t.amount_paise) / 100).toLocaleString('en-IN')
              return `${i + 1}. [${date}] ${t.entry_type} | ${t.transaction_type} | ${amount} | ${t.description}`
            }).join('\n')

            const client = new Anthropic({ apiKey })
            const message = await client.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 512,
              system: 'You are a personal finance assistant for a PPI wallet user in India. Be concise, friendly, and use INR currency formatting. Address the user directly.',
              messages: [{
                role: 'user',
                content: `Here are my recent wallet transactions. Give me a 3-5 line plain English summary covering: total count, total spending vs income, largest transaction, and any tips or patterns you notice.\n\nTransactions:\n${formatted}`,
              }],
            })

            const textBlock = message.content.find((b: any) => b.type === 'text')
            const summary = textBlock ? (textBlock as any).text : 'No summary generated.'

            res.writeHead(200)
            res.end(JSON.stringify({ summary }))
          } catch (err: any) {
            console.error('[Summarise] Error:', err?.message || err)
            res.writeHead(502)
            res.end(JSON.stringify({ error: `Claude API error: ${err?.message || 'Unknown error'}` }))
          }
        })
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
