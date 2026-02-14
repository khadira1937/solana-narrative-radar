import { Connection, PublicKey } from '@solana/web3.js'

// BPF Loader Upgradeable program (for program deploy / upgrade activity)
const BPF_UPGRADEABLE_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')

export type OnchainSignals = {
  upgradeableLoaderTxCountCurrent: number
  upgradeableLoaderTxCountPrevious: number
  pctChangeUpgradeableLoader: number
  uniqueFeePayersCurrent: number
  uniqueFeePayersPrevious: number
  pctChangeUniqueFeePayers: number
  failureRateCurrentPct: number
  failureRatePreviousPct: number
  sampleSignatures: string[]
}

export function getSolanaConnection() {
  const url = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  return new Connection(url, 'confirmed')
}

export async function fetchOnchainSignals(params: {
  current: { from: Date; to: Date }
  previous: { from: Date; to: Date }
  limit?: number
}): Promise<OnchainSignals> {
  const conn = getSolanaConnection()
  const pageSize = 1000
  const max = params.limit ?? 6000

  const toMs = (bt?: number | null) => (bt ? bt * 1000 : NaN)

  const sigs: Awaited<ReturnType<Connection['getSignaturesForAddress']>> = []
  let before: string | undefined

  // Paginate until we have enough signatures OR we've gone older than the previous window.
  while (sigs.length < max) {
    const batch = await conn.getSignaturesForAddress(BPF_UPGRADEABLE_LOADER, {
      limit: Math.min(pageSize, max - sigs.length),
      before,
    })
    if (!batch.length) break
    sigs.push(...batch)

    const oldest = batch[batch.length - 1]
    const oldestMs = toMs(oldest.blockTime)
    if (Number.isFinite(oldestMs) && oldestMs < params.previous.from.getTime()) break

    before = oldest.signature
  }

  const cur = sigs.filter((s) => {
    const t = toMs(s.blockTime)
    return Number.isFinite(t) && t >= params.current.from.getTime() && t < params.current.to.getTime()
  })
  const prev = sigs.filter((s) => {
    const t = toMs(s.blockTime)
    return Number.isFinite(t) && t >= params.previous.from.getTime() && t < params.previous.to.getTime()
  })

  const pct = prev.length === 0 ? (cur.length === 0 ? 0 : 999) : ((cur.length - prev.length) / prev.length) * 100

  // Extra on-chain indicators (lightweight, explainable):
  // - unique fee payers (wallet participation proxy)
  // - failure rate (stress/instability proxy)
  // We only sample a limited number of txs to keep this fast + reproducible.
  const SAMPLE_TXS = 220
  const curSample = cur.slice(0, SAMPLE_TXS)
  const prevSample = prev.slice(0, SAMPLE_TXS)

  async function hydrate(signatures: { signature: string }[]) {
    const txs = await Promise.all(
      signatures.map((s) =>
        conn
          .getTransaction(s.signature, { maxSupportedTransactionVersion: 0 })
          .catch(() => null),
      ),
    )
    const feePayers = new Set<string>()
    let failed = 0
    let total = 0
    for (const tx of txs) {
      if (!tx) continue
      total++
      const msg: any = tx.transaction.message as any
      const payerKey =
        msg.accountKeys?.[0] || msg.staticAccountKeys?.[0] || msg.getAccountKeys?.().staticAccountKeys?.[0] || null
      const payer = payerKey?.toBase58?.()
      if (payer) feePayers.add(payer)
      if (tx.meta?.err) failed++
    }
    const failureRatePct = total === 0 ? 0 : (failed / total) * 100
    return { uniqueFeePayers: feePayers.size, failureRatePct: Math.round(failureRatePct * 10) / 10 }
  }

  const [curHyd, prevHyd] = await Promise.all([hydrate(curSample), hydrate(prevSample)])
  const pctFeePayers = prevHyd.uniqueFeePayers === 0 ? (curHyd.uniqueFeePayers === 0 ? 0 : 999) : ((curHyd.uniqueFeePayers - prevHyd.uniqueFeePayers) / prevHyd.uniqueFeePayers) * 100

  return {
    upgradeableLoaderTxCountCurrent: cur.length,
    upgradeableLoaderTxCountPrevious: prev.length,
    pctChangeUpgradeableLoader: Math.round(pct * 10) / 10,

    uniqueFeePayersCurrent: curHyd.uniqueFeePayers,
    uniqueFeePayersPrevious: prevHyd.uniqueFeePayers,
    pctChangeUniqueFeePayers: Math.round(pctFeePayers * 10) / 10,

    failureRateCurrentPct: curHyd.failureRatePct,
    failureRatePreviousPct: prevHyd.failureRatePct,

    sampleSignatures: sigs.slice(0, 10).map((s) => s.signature),
  }
}
