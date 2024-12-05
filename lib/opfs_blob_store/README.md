store sha256 addressable data in OPFS

```js
import OpfsBlobStore from "opfs_blob_store"

// API
const bs = await OpfsBlobStore.create()
// download, check, and store
await bs.fetch(hash, url, onProgress)
// verify data
await bs.verify(hash, onProgress)
// does file exists
await bs.has(hash)
// retrive file from store
await bs.get(hash)
// delete file from store
await bs.delete(hash)
// list all data
await bs.keys()

// how to use

const hash = "26150972b0d5e221fe3509075d5916cd3dc4998ef219f4057cd0bd3b9e8f6c58"
const url =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Ursus_americanus.jpg/252px-Ursus_americanus.jpg"
const bs = await OpfsBlobStore.create()
const onProgress = ratio => `${Math.round(ratio * 100, 2)}%`

await bs.fetch(hash, url, onProgress)
await bs.verify(hash, onProgress)

const file = await bs.get(hash)
```
