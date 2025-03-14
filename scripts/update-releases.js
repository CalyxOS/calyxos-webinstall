import https from "https"
import yaml from "js-yaml"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const base_path = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const releases_dest_path = path.resolve(base_path, "public", "releases", "index.json")

// use gitlab because calyxos.org/data/downloads.yml returns a 404
const releases_src_url =
  "https://gitlab.com/CalyxOS/calyxos.org/-/raw/main/pages/_data/downloads.yml"
// const releases_src_url = 'https://calyxos.org/data/downloads.yml'

// { codename: { name: string, codename, version, variant, url, web_install }
function generateReleases(doc) {
  return doc["factory"].reduce(function (acc, device) {
    acc[device["codename"]] = {
      name: device["name"],
      codename: device["codename"],
      date: device["date"],
      version: device["version"],
      variant: "factory",
      url: device["web_install"] ? device["factory_link"] : "",
      sha256: device["factory_sha256"],
      web_install: device["web_install"],
    }
    return acc
  }, {})
}

function main() {
  https
    .get(releases_src_url, (res) => {
      if (res.statusCode !== 200) {
        res.resume() // Consume response data to free up memory
        throw new Error(`Request Failed. Status Code: ${res.statusCode}`)
      }

      let body = ""
      res.on("data", (chunk) => {
        body += chunk
      })

      res.on("end", () => {
        try {
          const doc = yaml.load(body)
          const releases = generateReleases(doc)
          console.log(
            `${Object.values(releases).filter((release) => release.web_install).length} devices are ready`,
          )

          fs.writeFile(
            releases_dest_path,
            JSON.stringify(releases, null, "  ") + "\n",
            function (err) {
              if (err) {
                return console.log(err)
              } else {
                console.log(`WROTE ${releases_dest_path}`)
              }
            },
          )
        } catch (error) {
          console.error(error.message)
        }
      })
    })
    .on("error", (error) => {
      console.error(error.message)
    })
}

main()
