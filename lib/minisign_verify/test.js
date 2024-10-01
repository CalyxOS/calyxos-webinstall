import test from 'node:test'
import fetch from 'node-fetch'
import MinisignVerify, { parsePublicKey, parseSignature, verify, InvalidSignatureError } from './minisign_verify.mjs'

const BASE =  "https://0xacab.org/calyx/experiments/minisign_test_data/-/raw/dbafc89123057f74dc018cbe2de317667357db3c"
const dataUrl = `${BASE}/data.file`

const publicKeyText = "untrusted comment: minisign public key 95CB3D8CF7A66674\nRWR0Zqb3jD3LlcY1idTZNiLR4wgI/pzB6svVbhyiQyW7YQy/L4xqGoAY"
const publicKey = parsePublicKey(publicKeyText)
// const publicKey = parsePublicKey(await fetch(`${BASE}/minisign.pub`).then(r => r.text()))

test("parseSignature", (t) => {
  const signature = parseSignature(`untrusted comment: signature from minisign secret key
RUR0Zqb3jD3LlekB3+GMzibqeOl8wxk2R4+aEdDGkXPUenyPWGVQH1R+2P7texqeZI+XMS+oa1zZuxqKS1hLYxXzyjV7qnY/IQ8=
trusted comment: example signed comment
urFDk6DxovmPWu5+9WRF7HQuUgfD7h9Kd6L3Ux+PaSoei2C0BhvBsp5LzCMSI8N1VFhYDeKM6txL9eJMVMJHBA==`)
  t.assert.strictEqual(signature.untrustedComment, 'signature from minisign secret key')
  t.assert.strictEqual(signature.trustedComment, 'example signed comment')
  t.assert.deepStrictEqual(signature.signatureAlgorithm, new Uint8Array([ 69, 68 ]))
  t.assert.ok(signature.keyID instanceof Uint8Array)
  t.assert.ok(signature.signature instanceof Uint8Array)
  t.assert.ok(signature.globalSignature instanceof Uint8Array)
})

test('valid signature with arrayBuffer', async (t) => {
  const signatureFile = await fetch(dataUrl + ".minisig").then(r => r.text())
  const signature = parseSignature(signatureFile)
  const data = await fetch(dataUrl).then( r => r.arrayBuffer()).then(buffer => new Uint8Array(buffer))
  t.assert.ok(await verify(signature, data, publicKey))
});

test('valid signature via streaming', async (t) => {
  const signatureFile = await fetch(dataUrl + ".minisig").then(r => r.text())
  const signature = parseSignature(signatureFile)
  const response = await fetch(dataUrl)
  t.assert.ok(await verify(signature, response.body, publicKey))
})

test('invalid signature', async (t) => {
    const signature = parseSignature(`untrusted comment: signature from minisign secret key
RUR0Zqb3jD3LlekB3+GMzibqeOl9wxk2R4+aEdDGkXPUenyPWGVQH1R+2P7texqeZI+XMS+oa1zZuxqKS1hLYxXzyjV7qnY/IQ8=
trusted comment: example signed comment
urFDk6DxovmPWu5+9WRF7HQuUgfD7h9Kd6L3Ux+PaSoei2C0BhvBsp5LzCMSI8N1VFhYDeKM6txL9eJMVMJHBA==`)

  await t.assert.rejects(async () => {
    const data = await fetch(dataUrl).then( r => r.arrayBuffer()).then(buffer => new Uint8Array(buffer))
    await verify(signature, data, publicKey)
  }, InvalidSignatureError)
})

test('invalid trusted comment', async (t) => {
    const signature = parseSignature(`untrusted comment: signature from minisign secret key
RUR0Zqb3jD3LlekB3+GMzibqeOl8wxk2R4+aEdDGkXPUenyPWGVQH1R+2P7texqeZI+XMS+oa1zZuxqKS1hLYxXzyjV7qnY/IQ8=
trusted comment: example signed comment
urFDk6DxovmPWu5+9WRF7HQuUgfD8h9Kd6L3Ux+PaSoei2C0BhvBsp5LzCMSI8N1VFhYDeKM6txL9eJMVMJHBA==`)

  await t.assert.rejects(async () => {
    const data = await fetch(dataUrl).then( r => r.arrayBuffer()).then(buffer => new Uint8Array(buffer))
    await verify(signature, data, publicKey)
  }, InvalidSignatureError)
})

test('corrupted data', async (t) => {
  const signatureFile = await fetch(dataUrl + ".minisig").then(r => r.text())
  const signature = parseSignature(signatureFile)
  const data = await fetch(dataUrl).then( r => r.arrayBuffer()).then(buffer => new Uint8Array(buffer))
  data[0]+=1

  await t.assert.rejects(async () => {
    await verify(signature, data, publicKey)
  }, InvalidSignatureError)

})
