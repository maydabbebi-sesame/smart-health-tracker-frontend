const http = require('http')
const fs = require('fs')
const path = require('path')

const port = Number(process.env.PORT || 5173)
const host = process.env.HOST || '127.0.0.1'
const root = path.join(process.cwd(), 'dist')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath)

  response.writeHead(200, {
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
  })
  fs.createReadStream(filePath).pipe(response)
}

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(request.url.split('?')[0])
  let filePath = path.join(root, requestPath === '/' ? 'index.html' : requestPath)

  if (!filePath.startsWith(root)) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html')
  }

  sendFile(response, filePath)
})

server.listen(port, host, () => {
  console.log(`Smart Health Tracker running at http://localhost:${port}`)
})
