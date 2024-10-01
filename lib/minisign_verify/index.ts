import { verifyAsync } from '@noble/ed25519'
import { blake2b, blake2bInit, blake2bUpdate, blake2bFinal } from 'blakejs'
import equal from 'fast-deep-equal/es6'

const CALYXOS_PUBLIC_KEY = "untrusted comment: minisign public key 4B8CFE498C4E5B13\nRWQTW06MSf6MS4v/jKlIadiOuj4eO3OVRkU7e06qwoBIErmXapAs3iSP"

export class MinisignParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MinisignParseError';
  }
}

export class InvalidSignatureError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidSignatureError';
  }
}

function parseBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export type PublicKey = {
  untrustedComment: string;
  signatureAlgorithm: Uint8Array;
  keyID: Uint8Array;
  publicKey: Uint8Array;
}

export type Signature = {
  untrustedComment: string;
  signatureAlgorithm: Uint8Array;
  keyID: Uint8Array;
  signature: Uint8Array;
  trustedComment: string;
  globalSignature: Uint8Array;
}

// CalyxOS public key:
//   untrusted comment: minisign public key 4B8CFE498C4E5B13
//   RWQTW06MSf6MS4v/jKlIadiOuj4eO3OVRkU7e06qwoBIErmXapAs3iSP
export function parsePublicKey(text: string): PublicKey {
  const lines = text.trim().split('\n')

  if (lines.length !== 2 || lines[0].slice(0,19) !== 'untrusted comment: ') {
    throw new MinisignParseError('invalid public key')
  }

  const untrustedComment = lines[0].slice(19)
  const key = parseBase64(lines[1])
  const signatureAlgorithm = key.subarray(0, 2)
  const keyID = key.subarray(2, 10)
  const publicKey = key.subarray(10)

  // only algorithm is Ed
  if (!(signatureAlgorithm[0] === 'E'.charCodeAt(0) && signatureAlgorithm[1] === 'd'.charCodeAt(0))) {
    throw new MinisignParseError('invalid signature algorithm')
  }

  // ed25519 keys are 32 bytes
  if (publicKey.length !== 32) {
    throw new MinisignParseError('invalid ed25519 key length')
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
export function parseSignature(signatureFile: string): Signature {
  const lines = signatureFile.trim().split('\n')

  if (lines.length !== 4 || lines[0].slice(0,19) !== 'untrusted comment: ' || lines[2].slice(0,17) !== 'trusted comment: ') {
    console.debug(lines)
    throw new MinisignParseError('invalid signature format')
  }

  const untrustedComment = lines[0].slice(19)
  const trustedComment = lines[2].slice(17)

  const sigInfo = parseBase64(lines[1])
  const signatureAlgorithm = sigInfo.subarray(0, 2)
  const keyID = sigInfo.subarray(2, 10)
  const signature = sigInfo.subarray(10)

  // Only support 'ED', the newer hashed version
  if (!(signatureAlgorithm[0] === 'E'.charCodeAt(0) && signatureAlgorithm[1] === 'D'.charCodeAt(0))) {
    throw new MinisignParseError('invalid signature algorithm')
  }

  const globalSignature = parseBase64(lines[3])

  return {
    untrustedComment,
    signatureAlgorithm,
    keyID,
    signature,
    trustedComment,
    globalSignature
  }
}

export async function verify(
  signature: Signature,
  originalContent: Uint8Array | Buffer | string | ReadableStream,
  publicKey: PublicKey,
  onProgress: undefined | ((i: number) => void),
  contentLength: undefined | number
): Promise<boolean> {
  if (!equal(signature.keyID, publicKey.keyID)) {
    throw new InvalidSignatureError('keyID\'s do not match')
  }

  var hashedContent: Uint8Array

  /// if async interable, use streaming
  if (typeof originalContent[Symbol.asyncIterator] === 'function') {
    let context = blake2bInit(64)
    let progress = 0

    for await (const chunk of originalContent) {
      blake2bUpdate(context, chunk)
      progress += chunk.length

      if (onProgress && contentLength) {
        onProgress(progress / contentLength)
      }
    }
    hashedContent = blake2bFinal(context)
  } else {
    hashedContent = blake2b(originalContent)
  }

  // ed25519(Blake2b-512(<file data>))
  if (await verifyAsync(signature.signature, hashedContent, publicKey.publicKey)) {
    // ed25519(<signature> || <trusted_comment>)
    const globalSignatureContent = new Uint8Array([...signature.signature, ...stringToUint8Array(signature.trustedComment)])

    if (await verifyAsync(signature.globalSignature, globalSignatureContent, publicKey.publicKey)) {
      return Promise.resolve(true)
    } else {
      throw new InvalidSignatureError('Invalid global signature. For more information go to <URL>')
    }
  } else {
    throw new InvalidSignatureError('Invalid signature. For more information go to <URL>')
  }
}

export default class MinisignVerify {
  static async verify(content: File, signatureFile: string, onProgress: (i: number)  => void) {
    const signature = parseSignature(signatureFile)
    const publicKey = parsePublicKey(CALYXOS_PUBLIC_KEY)
    return verify(signature, content.stream(), publicKey, onProgress, content.size)
  }
}
