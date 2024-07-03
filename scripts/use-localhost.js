// updates urls in public/releases/index.json to use localhost/calyxos
import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url'

const base_path = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const releases_dest_path = path.resolve(base_path, 'public', 'releases', 'index.json')
const data = JSON.parse(fs.readFileSync(releases_dest_path))

for (let [key, value] of Object.entries(data)) {
  value['url'] = value['url'].replace('https://release.calyxinstitute.org', 'http://localhost:5173/calyxos')
}

fs.writeFileSync(releases_dest_path, JSON.stringify(data, null, "  "))
