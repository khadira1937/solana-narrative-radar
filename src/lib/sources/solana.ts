import { Connection, PublicKey } from '@solana/web3.js'

// BPF Loader Upgradeable program (for program deploy / upgrade activity)
const BPF_UPGRADEABLE_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')

export type OnchainSignals = {
  upgradeableLoaderTxCountCurrent: number
  upgradeableLoaderTxCountPrevious: number
  pctChangeUpgradeableLoader: number
  sampleSignatures: string[]
}

export function getSolanaConnection() {
  const url = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  return new Connection(url, 'confirmed')
}

export async function fetchOnchainSignals(params: { current: { from: Date; to: Date }; previous: { from: Date; to: Date }; limit?: number }): Promise<OnchainSignals> {
  const conn = getSolanaConnection()
  const limit = params.limit ?? 1000
  const sigs = await conn.getSignaturesForAddress(BPF_UPGRADEABLE_LOADER, { limit })

  const toMs = (bt?: number | null) => (bt ? bt * 1000 : NaN)
  const cur = sigs.filter((s) => {
    const t = toMs(s.blockTime)
    return Number.isFinite(t) && t >= params.current.from.getTime() && t < params.current.to.getTime()
  })
  const prev = sigs.filter((s) => {
    const t = toMs(s.blockTime)
    return Number.isFinite(t) && t >= params.previous.from.getTime() && t < params.previous.to.getTime()
  })

  const pct = prev.length === 0 ? (cur.length === 0 ? 0 : 999) : ((cur.length - prev.length) / prev.length) * 100

  return {
    upgradeableLoaderTxCountCurrent: cur.length,
    upgradeableLoaderTxCountPrevious: prev.length,
    pctChangeUpgradeableLoader: Math.round(pct * 10) / 10,
    sampleSignatures: sigs.slice(0, 10).map((s) => s.signature),
  }
}
