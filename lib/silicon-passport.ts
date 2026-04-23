export type PassportVerificationStatus =
  | 'idle'
  | 'initializing'
  | 'verified'
  | 'mismatch'
  | 'error'

export interface PassportAnchorRecord {
  fingerprint: string
  timestamp: string
  transactionHash: string
}

function getCrypto() {
  const webCrypto = globalThis.crypto

  if (!webCrypto?.subtle) {
    throw new Error('Web Crypto API is unavailable in this environment.')
  }

  return webCrypto
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

async function sha256Hex(value: string) {
  const crypto = getCrypto()
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return toHex(digest)
}

export class SiliconPassport {
  static async generateFingerprint(hardwareId: string) {
    const normalizedId = hardwareId.trim().toLowerCase()

    if (!normalizedId) {
      throw new Error('A hardware ID is required to derive a silicon fingerprint.')
    }

    // Deterministic PUF simulation derived from the supplied hardware identity.
    return sha256Hex(`ghostops:puf:${normalizedId}`)
  }

  static async deriveBlockchainId(fingerprint: string) {
    return sha256Hex(`ghostops:did:${fingerprint}`)
  }

  static async anchorToLedger(
    fingerprint: string,
    timestamp = new Date().toISOString(),
  ): Promise<PassportAnchorRecord> {
    const transactionHash = await sha256Hex(`ghostops:anchor:${fingerprint}:${timestamp}`)

    return {
      fingerprint,
      timestamp,
      transactionHash,
    }
  }

  static async verifyFingerprint(
    hardwareId: string,
    registeredBlockchainId: string,
  ): Promise<PassportVerificationStatus> {
    const fingerprint = await SiliconPassport.generateFingerprint(hardwareId)
    const localBlockchainId = await SiliconPassport.deriveBlockchainId(fingerprint)

    return localBlockchainId === registeredBlockchainId ? 'verified' : 'mismatch'
  }
}
