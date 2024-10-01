async function start(data) {
  if (!data.release) {
    throw new Error("event data missing")
  }

  const onProgress = (i) => {
    postMessage({ "type": "progress", i: i})
  }

  try {



    postMessage({ "type": "complete" })
    return true
  } catch(e) {
    postMessage( { "type": "error", e: e })
    return false
  }
}

onmessage = function(e) {
  if (e.data.type === 'start') {
    start(e.data)
  } else {
    throw new Error(`unknown type: ${e.data.type}`)
  }
}
