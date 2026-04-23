'use client'

import { useEffect, useState } from 'react'
import { SiliconPassport } from '../lib/silicon-passport'
import type {
  PassportAnchorRecord,
  PassportVerificationStatus,
} from '../lib/silicon-passport'

interface UsePassportOptions {
  hardwareId: string
  registeredBlockchainId: string
}

interface UsePassportResult {
  fingerprint: string | null
  blockchainId: string | null
  anchorRecord: PassportAnchorRecord | null
  verificationStatus: PassportVerificationStatus
}

export function usePassport({
  hardwareId,
  registeredBlockchainId,
}: UsePassportOptions): UsePassportResult {
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [blockchainId, setBlockchainId] = useState<string | null>(null)
  const [anchorRecord, setAnchorRecord] = useState<PassportAnchorRecord | null>(null)
  const [verificationStatus, setVerificationStatus] =
    useState<PassportVerificationStatus>('idle')

  useEffect(() => {
    let active = true

    async function initializePassport() {
      try {
        setVerificationStatus('initializing')

        const localFingerprint = await SiliconPassport.generateFingerprint(hardwareId)
        const localBlockchainId = await SiliconPassport.deriveBlockchainId(localFingerprint)
        const ledgerAnchor = await SiliconPassport.anchorToLedger(localFingerprint)
        const status = registeredBlockchainId
          ? await SiliconPassport.verifyFingerprint(hardwareId, registeredBlockchainId)
          : 'initializing'

        if (!active) {
          return
        }

        setFingerprint(localFingerprint)
        setBlockchainId(localBlockchainId)
        setAnchorRecord(ledgerAnchor)
        setVerificationStatus(status)
      } catch (error) {
        console.error('Passport initialization failed:', error)

        if (!active) {
          return
        }

        setVerificationStatus('error')
      }
    }

    initializePassport()

    return () => {
      active = false
    }
  }, [hardwareId, registeredBlockchainId])

  return {
    fingerprint,
    blockchainId,
    anchorRecord,
    verificationStatus,
  }
}
