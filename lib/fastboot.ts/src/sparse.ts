// The MIT License (MIT)

// Copyright (c) 2021 Danny Lin <danny@kdrag0n.dev>
// Copyright (c) 2025 ziggy <ziggy@calyxinstitute.org>

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const FILE_MAGIC = 0xed26ff3a

const MAJOR_VERSION = 1
const MINOR_VERSION = 0
export const FILE_HEADER_SIZE = 28
const CHUNK_HEADER_SIZE = 12

// AOSP libsparse uses 64 MiB chunks
const RAW_CHUNK_SIZE = 64 * 1024 * 1024

export class ImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ImageError"
  }
}

export interface SparseSplit {
  data: ArrayBuffer
  bytes: number
}

export enum ChunkType {
  Raw = 0xcac1,
  Fill = 0xcac2,
  Skip = 0xcac3,
  Crc32 = 0xcac4,
}

export interface SparseHeader {
  blockSize: number
  blocks: number
  chunks: number
  crc32: number
}

export interface SparseChunk {
  type: ChunkType
  /* 2: reserved, 16 bits */
  blocks: number
  dataBytes: number
  data: Blob | null // to be populated by consumer
}

class BlobBuilder {
  private blob: Blob
  private type: string

  constructor(type: string = "") {
    this.type = type
    this.blob = new Blob([], { type: this.type })
  }

  append(blob: Blob) {
    this.blob = new Blob([this.blob, blob], { type: this.type })
  }

  getBlob(): Blob {
    return this.blob
  }
}

/**
 * Returns a parsed version of the sparse image file header from the given buffer.
 *
 * @param {ArrayBuffer} buffer - Raw file header data.
 * @returns {SparseHeader} Object containing the header information.
 */
export function parseFileHeader(buffer: ArrayBuffer): SparseHeader | null {
  const view = new DataView(buffer)

  const magic = view.getUint32(0, true)
  if (magic !== FILE_MAGIC) {
    return null
  }

  // v1.0+
  const major = view.getUint16(4, true)
  const minor = view.getUint16(6, true)
  if (major !== MAJOR_VERSION || minor < MINOR_VERSION) {
    throw new ImageError(`Unsupported sparse image version ${major}.${minor}`)
  }

  const fileHdrSize = view.getUint16(8, true)
  const chunkHdrSize = view.getUint16(10, true)
  if (fileHdrSize !== FILE_HEADER_SIZE || chunkHdrSize !== CHUNK_HEADER_SIZE) {
    throw new ImageError(
      `Invalid file header size ${fileHdrSize}, chunk header size ${chunkHdrSize}`,
    )
  }

  const blockSize = view.getUint32(12, true)
  if (blockSize % 4 !== 0) {
    throw new ImageError(`Block size ${blockSize} is not a multiple of 4`)
  }

  return {
    blockSize: blockSize,
    blocks: view.getUint32(16, true),
    chunks: view.getUint32(20, true),
    crc32: view.getUint32(24, true),
  }
}

function parseChunkHeader(buffer: ArrayBuffer): SparseChunk {
  const view = new DataView(buffer)

  // This isn't the same as what createImage takes.
  // Further processing needs to be done on the chunks.
  return {
    type: view.getUint16(0, true),
    /* 2: reserved, 16 bits */
    blocks: view.getUint32(4, true),
    dataBytes: view.getUint32(8, true) - CHUNK_HEADER_SIZE,
    data: null, // to be populated by consumer
  }
}

function calcChunksBlockSize(chunks: Array<SparseChunk>) {
  return chunks.map((chunk) => chunk.blocks).reduce((total, c) => total + c, 0)
}

function calcChunksDataSize(chunks: Array<SparseChunk>) {
  return chunks.map((chunk) => chunk.data!.size).reduce((total, c) => total + c, 0)
}

function calcChunksSize(chunks: Array<SparseChunk>) {
  // 28-byte file header, 12-byte chunk headers
  const overhead = FILE_HEADER_SIZE + CHUNK_HEADER_SIZE * chunks.length
  return overhead + calcChunksDataSize(chunks)
}

async function createImage(header: SparseHeader, chunks: Array<SparseChunk>): Promise<Blob> {
  const blobBuilder = new BlobBuilder()

  let buffer = new ArrayBuffer(FILE_HEADER_SIZE)
  let dataView = new DataView(buffer)
  let arrayView = new Uint8Array(buffer)

  dataView.setUint32(0, FILE_MAGIC, true)
  // v1.0
  dataView.setUint16(4, MAJOR_VERSION, true)
  dataView.setUint16(6, MINOR_VERSION, true)
  dataView.setUint16(8, FILE_HEADER_SIZE, true)
  dataView.setUint16(10, CHUNK_HEADER_SIZE, true)

  // Match input parameters
  dataView.setUint32(12, header.blockSize, true)
  dataView.setUint32(16, header.blocks, true)
  dataView.setUint32(20, chunks.length, true)

  // We don't care about the CRC. AOSP docs specify that this should be a CRC32,
  // but AOSP libsparse always sets 0 and puts the CRC in a final undocumented
  // 0xCAC4 chunk instead.
  dataView.setUint32(24, 0, true)

  blobBuilder.append(new Blob([buffer]))
  for (const chunk of chunks) {
    buffer = new ArrayBuffer(CHUNK_HEADER_SIZE + chunk.data!.size)
    dataView = new DataView(buffer)
    arrayView = new Uint8Array(buffer)

    dataView.setUint16(0, chunk.type, true)
    dataView.setUint16(2, 0, true) // reserved
    dataView.setUint32(4, chunk.blocks, true)
    dataView.setUint32(8, CHUNK_HEADER_SIZE + chunk.data!.size, true)

    const chunkArrayView = new Uint8Array(await chunk.data!.arrayBuffer())
    arrayView.set(chunkArrayView, CHUNK_HEADER_SIZE)
    blobBuilder.append(new Blob([buffer]))
  }

  return blobBuilder.getBlob()
}

/**
 * Creates a sparse image from buffer containing raw image data.
 *
 * @param {Blob} blob - Blob containing the raw image data.
 * @returns {Promise<Blob>} Promise that resolves the blob containing the new sparse image.
 */
export async function fromRaw(blob: Blob): Promise<Blob> {
  const header = {
    blockSize: 4096,
    blocks: blob.size / 4096,
    chunks: 1,
    crc32: 0,
  }

  const chunks: SparseChunk[] = []
  while (blob.size > 0) {
    const chunkSize = Math.min(blob.size, RAW_CHUNK_SIZE)
    chunks.push({
      type: ChunkType.Raw,
      blocks: chunkSize / header.blockSize,
      data: blob.slice(0, chunkSize),
    })
    blob = blob.slice(chunkSize)
  }

  return createImage(header, chunks)
}

/**
 * Split a sparse image into smaller sparse images within the given size.
 * This takes a Blob instead of an ArrayBuffer because it may process images
 * larger than RAM.
 *
 * @param {Blob} blob - Blob containing the sparse image to split.
 * @param {number} splitSize - Maximum size per split.
 * @yields {Object} Data of the next split image and its output size in bytes.
 */
export async function* splitBlob(blob: Blob, splitSize: number) {
  console.debug(`Splitting ${blob.size}-byte sparse image into ${splitSize}-byte chunks`)

  // 7/8 is a safe value for the split size, to account for extra overhead
  // AOSP source code does the same
  const safeSendValue = Math.floor(splitSize * (7 / 8))

  // Short-circuit if splitting isn't required
  if (blob.size <= splitSize) {
    console.debug("Blob fits in 1 payload, not splitting")
    yield {
      data: await blob.arrayBuffer(),
      bytes: blob.size,
    } as SparseSplit
    return
  }

  const headerData = await blob.slice(0, FILE_HEADER_SIZE).arrayBuffer()

  const header = parseFileHeader(headerData)
  if (header === null) {
    throw new ImageError("Blob is not a sparse image")
  }

  // Remove CRC32 (if present), otherwise splitting will invalidate it
  header.crc32 = 0
  blob = blob.slice(FILE_HEADER_SIZE)

  let splitChunks: Array<SparseChunk> = []
  let splitDataBytes = 0
  for (let i = 0; i < header.chunks; i++) {
    const chunkHeaderData = await blob.slice(0, CHUNK_HEADER_SIZE).arrayBuffer()
    const originalChunk = parseChunkHeader(chunkHeaderData)
    originalChunk.data = blob.slice(CHUNK_HEADER_SIZE, CHUNK_HEADER_SIZE + originalChunk.dataBytes)
    blob = blob.slice(CHUNK_HEADER_SIZE + originalChunk.dataBytes)

    const chunksToProcess: SparseChunk[] = []

    // take into account cases where the chunk data is bigger than the maximum allowed download size
    if (originalChunk.dataBytes > safeSendValue) {
      console.debug(
        `Data of chunk ${i} is bigger than the maximum allowed download size: ${originalChunk.dataBytes} > ${safeSendValue}`,
      )

      // we should now split this chunk into multiple chunks that fit
      let originalDataBytes = originalChunk.dataBytes
      let originalData = originalChunk.data

      while (originalDataBytes > 0) {
        const toSend = Math.min(safeSendValue, originalDataBytes)

        chunksToProcess.push({
          type: originalChunk.type,
          dataBytes: toSend,
          data: originalData.slice(0, toSend),
          blocks: toSend / header?.blockSize,
        })

        originalData = originalData.slice(toSend)
        originalDataBytes -= toSend
      }

      console.debug("chunksToProcess", chunksToProcess)
    } else {
      chunksToProcess.push(originalChunk)
    }

    for (const chunk of chunksToProcess) {
      const bytesRemaining = splitSize - calcChunksSize(splitChunks)
      console.debug(
        `  Chunk ${i}: type ${chunk.type}, ${chunk.dataBytes} bytes / ${chunk.blocks} blocks, ${bytesRemaining} bytes remaining`,
      )

      if (bytesRemaining >= chunk.dataBytes) {
        // Read the chunk and add it
        console.debug("    Space is available, adding chunk")
        splitChunks.push(chunk)
        // Track amount of data written on the output device, in bytes
        splitDataBytes += chunk.blocks * header.blockSize
      } else {
        // Out of space, finish this split
        // Blocks need to be calculated from chunk headers instead of going by size
        // because FILL and SKIP chunks cover more blocks than the data they contain.
        const splitBlocks = calcChunksBlockSize(splitChunks)
        splitChunks.push({
          type: ChunkType.Skip,
          blocks: header.blocks - splitBlocks,
          data: new Blob([]),
          dataBytes: 0,
        })
        console.debug(
          `Partition is ${header.blocks} blocks, used ${splitBlocks}, padded with ${
            header.blocks - splitBlocks
          }, finishing split with ${calcChunksBlockSize(splitChunks)} blocks`,
        )
        const splitImage = await createImage(header, splitChunks)
        console.debug(`Finished ${splitImage.size}-byte split with ${splitChunks.length} chunks`)
        yield {
          data: await splitImage.arrayBuffer(),
          bytes: splitDataBytes,
        } as SparseSplit

        // Start a new split. Every split is considered a full image by the
        // bootloader, so we need to skip the *total* written blocks.
        console.debug(`Starting new split: skipping first ${splitBlocks} blocks and adding chunk`)
        splitChunks = [
          {
            type: ChunkType.Skip,
            blocks: splitBlocks,
            data: new Blob([]),
            dataBytes: 0,
          },
          chunk,
        ]

        splitDataBytes = chunk.dataBytes
      }
    }
  }

  // Finish the final split if necessary
  if (
    splitChunks.length > 0 &&
    (splitChunks.length > 1 || splitChunks[0].type !== ChunkType.Skip)
  ) {
    const splitImage = await createImage(header, splitChunks)
    console.debug(
      `Finishing final ${splitImage.size}-byte split with ${splitChunks.length} chunks`,
    )
    yield {
      data: await splitImage.arrayBuffer(),
      bytes: splitDataBytes,
    } as SparseSplit
  }
}

export async function parseBlobHeader(blob: Blob): {
  blobSize: number
  totalBytes: number
  isSparse: boolean
} {
  const FILE_HEADER_SIZE = 28
  const blobSize = blob.size
  let totalBytes = blobSize
  let isSparse = false

  try {
    const fileHeader = await blob.slice(0, FILE_HEADER_SIZE).arrayBuffer()
    const sparseHeader = parseFileHeader(fileHeader)
    if (sparseHeader !== null) {
      totalBytes = sparseHeader.blocks * sparseHeader.blockSize
      isSparse = true
    }
  } catch (error) {
    console.debug(error)
    // ImageError = invalid, so keep blob.size
  }
  return { blobSize, totalBytes, isSparse }
}
