import { Connection, PublicKey } from '@solana/web3.js'

// BPF Loader Upgradeable program (for program deploy / upgrade activity)
const BPF_UPGRADEABLE_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')

export type OnchainSignals = {
  upgradeableLoaderTxCount: number
  sampleSignatures: string[]
}

export function getSolanaConnection() {
  const url = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  return new Connection(url, 'confirmed')
}

export async function fetchOnchainSignals(limit = 200): Promise<OnchainSignals> {
  const conn = getSolanaConnection()
  const sigs = await conn.getSignaturesForAddress(BPF_UPGRADEABLE_LOADER, { limit })
  return {
    upgradeableLoaderTxCount: sigs.length,
    sampleSignatures: sigs.slice(0, 10).map((s) => s.signature),
  }
}
