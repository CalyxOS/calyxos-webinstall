// updates urls in public/releases/index.json to use a difference host
// than the default of release.calyxinstitute.org
// example: node scripts/use-host.js 'https://localhost/calyxos'
import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url'
import { argv } from 'process'

const replacement = argv[2] ? argv[2] : 'http://localhost:5173/calyxos'
const base_path = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const releases_dest_path = path.resolve(base_path, 'public', 'releases', 'index.json')
const data = JSON.parse(fs.readFileSync(releases_dest_path))

for (let [key, value] of Object.entries(data)) {
  value['url'] = value['url'].replace('https://release.calyxinstitute.org', replacement)
}

fs.writeFileSync(releases_dest_path, JSON.stringify(data, null, "  "))
