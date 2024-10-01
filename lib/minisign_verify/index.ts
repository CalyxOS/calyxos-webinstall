class MinisignError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MinisignError';

  }
}

const CALYXOS_PUBLIC_KEY = "untrusted comment: minisign public key 4B8CFE498C4E5B13\nRWQTW06MSf6MS4v/jKlIadiOuj4eO3OVRkU7e06qwoBIErmXapAs3iSP"

function parseBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

type PublicKey = {
  untrustedComment: string;
  signatureAlgorithm: Uint8Array<2>;
  keyID: Uint8Array<8>;
  publicKey: Uint8Array<32>;
}

type Signature = {
  untrustedComment: string;
  signatureAlgorithm: Uint8Array<2>;
  keyID: Uint8Array<8>;
  signature: Uint8Array;
  trustedComment: string;
  globalSignature: Uint8Array;
}

type Release = {
  name: string;
  codename: string;
  date: string;
  version: string;
  variant: string;
  url: string;
  sha256: string;
  web_install: bool;
}

// CalyxOS public key:
//   untrusted comment: minisign public key 4B8CFE498C4E5B13
//   RWQTW06MSf6MS4v/jKlIadiOuj4eO3OVRkU7e06qwoBIErmXapAs3iSP
function parsePubKey(text: string): PublicKey {
  const lines = text.trim().split('\n')

  if (lines.length !== 2 || lines[0].slice(0,19) !== 'untrusted comment: ') {
    throw new MinisignError('invalid public key')
  }

  const untrustedComment = lines[0].slice(19)
  const key = parseBase64(lines[1])
  const signatureAlgorithm = key.subarray(0, 2)
  const keyID = key.subarray(2, 10)
  const publicKey = key.subarray(10)

  // only algorithm is Ed
  if (!(signatureAlgorithm[0] === 'E'.charCodeAt(0) && signatureAlgorithm[1] === 'd'.charCodeAt(0))) {
    throw new MinisignError('invalid signature algorithm')
  }

  // ed25519 keys are 32 bytes
  if (publicKey.length !== 32) {
    throw new MinisignError('invalid ed25519 key length')
  }

  return {
    untrustedComment,
    signatureAlgorithm,
    keyID,
    publicKey
  }
}

// example signature:
//   untrusted comment: signature from minisign secret key
//   RUQTW06MSf6MS35snAikBsR5ebbBzPTllB376V8e0eD+VFNvDt9ArY8SMEstDtWstkAq21soaT5EN0tZWYK+8VWLXRiuTtexhgc=
//   trusted comment: CalyxOS 5.11.0 - September 2024 Security
//   m2eSVXsNRRxUdlqB9mWh0jhy70ezY2pyFftRaHhLFncD4Jj6O+VT0J6HTPn9Gmu1DeQnFO7ZL/sO0fSYQNAcDQ==
function parseSignature(signatureFile: string): Signature {
  const lines = signatureFile.trim().split('\n')

  if (lines.length !== 4 || lines[0].slice(0,19) !== 'untrusted comment: ' || lines[0].slice(0,17) !== 'trusted comment: ') {
    throw new MinisignError('invalid signature format')
  }

  const untrustedComment = lines[0].slice(19)
  const trustedComment = lines[2].slice(17)

  const sigInfo = parseBase64(lines[1])
  const signatureAlgorithm = sigInfo.subarray(0, 2)
  const keyID = sigInfo.subarray(2, 10)
  const signature = sigInfo.subarray(10)

  // Only support 'ED', the newer hashed version
  if (!(signatureAlgorithm[0] === 'E'.charCodeAt(0) && signatureAlgorithm[1] === 'D'.charCodeAt(0))) {
    throw new MinisignError('invalid signature algorithm')
  }

  const globalSignature = parseBase64(lines[4])

  return {
    untrustedComment,
    signatureAlgorithm,
    keyID,
    signature,
    trustedComment,
    globalSignature
  }
}

function verify(signature: Signature, originalContent: Uint8Array, publicKey: PublicKey): Boolean {
}

async function fetchSignature(url) {
  const signatureUrl = url + ".minisig"
  return fetch(signatureUrl)
    .then( (response) => {
      if (!response.ok) {
        throw new MinisignError(`Request to ${signatureUrl} failed. Status code: ${response.status}`)
      }
      return response.text()
    })
}

export default class MinisignVerify {
  static async verify(release: Release) {
  }
}
