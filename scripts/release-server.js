#!/usr/bin/env node
// a http server to send a local file and simulate download issues
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { Transform } from "node:stream"

const ZIPFILE = path.resolve(process.env.HOME, ".cache", "calyxos", "lynx-factory-25605200.zip")
const PORT = 8800

var zipFileStats

fs.stat(ZIPFILE, (err, stats) => {
  if (err || !stats.isFile()) {
    throw new Error(`${ZIPFILE} not a file`)
  } else {
    zipFileStats = stats
  }
})

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url} from ${res.socket.remoteAddress}`)

  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Length": zipFileStats.size,
  })

  const readStream = fs.createReadStream(ZIPFILE)
  // readStream.pipe(res)

  const limitStream = maxSizeTransform(200000000)
  limitStream.on("error", () => res.destroy())
  readStream.pipe(limitStream).pipe(res)
})

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

function errorHandler(res) {
  return (err) => {
    res.statusCode = 500
    res.end(err.toString())
  }
}

function maxSizeTransform(max) {
  var size = 0

  return new Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length
      if (size > max) {
        let message = `max size ${max} exceeded`
        console.log(message)
        callback(new Error(message))
      } else {
        callback(null, chunk)
      }
    },
  })
}
