import { existsSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import app from './app.js'

const port = Number(process.env.PORT || 3001)
const distPath = path.join(process.cwd(), 'dist')

if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`CampusGo API running at http://localhost:${port}`)
})
