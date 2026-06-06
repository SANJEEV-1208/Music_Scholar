import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import uploadRouter from './routes/upload.js'
import chatRouter from './routes/chat.js'
import knowledgeRouter from './routes/knowledge.js'
import authRouter from './routes/auth.js'

dotenv.config()

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json({ limit: '50mb' }))

app.use('/api/auth', authRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/chat', chatRouter)
app.use('/api/knowledge', knowledgeRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`MusicScholar backend running on port ${port}`))
