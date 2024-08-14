store sha256 addressable data in OPFS


``` js
import OpfsBlobStore from OpfsBlobStore

// download, save, and verify url
await bs.fetch(hash, url, onProgress)
// get data from store
await bs.get(hash)
// re-verify existing key
await bs.verify(hash)
// remove data
await bs.delete(hash)
// list all data
await bs.keys()

// example

const hash = '26150972b0d5e221fe3509075d5916cd3dc4998ef219f4057cd0bd3b9e8f6c58'
const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Ursus_americanus.jpg/252px-Ursus_americanus.jpg'
const bs = await OpfsBlobStore.create()
const onProgress = (ratio) => `${Math.round(ratio * 100, 2)}% downloaded`
await bs.fetch(hash, url, onProgress)
const blob = await bs.get(hash)
```
