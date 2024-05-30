import https from "https"
import yaml from "js-yaml"
import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url'

const base_path = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const releases_dest_path = path.resolve(base_path, 'public', 'releases', 'index.json')
const releases_src_url = 'https://calyxos.org/data/downloads.yml'

function generateReleases (doc) {
  var releases = {"latest": {}}
  doc["stable"].forEach(device => {
    releases["latest"][device["codename"]] = [
      {
        "version": device["date"],
        "variant": "stable",
        "url": device["factory_link"]
      }
    ]
  })
  return releases
}

function main () {
  https.get(releases_src_url,(res) => {
    let body = ""
    res.on("data", (chunk) => {
      body += chunk
    })

    res.on("end", () => {
      try {
        const doc = yaml.load(body)
        const releases = generateReleases(doc)
        fs.writeFile(releases_dest_path, JSON.stringify(releases, null, "  "), function (err) {
          if (err) {
            return console.log(err)
          } else {
            console.log(`WROTE ${releases_dest_path}`)
          }
        })
      } catch (error) {
        console.error(error.message)
      }
    })
  }).on("error", (error) => {
    console.error(error.message)
  })
}

main()
