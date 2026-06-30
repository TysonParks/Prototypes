// DEV-ONLY: batch feature analysis — no SVG build (see FEATURES-AND-DETERMINISM.md Phase 3)

function randomAnalyzerHash() {
  const x = '0123456789abcdef'
  let hash = '0x'
  for (let i = 64; i > 0; --i) hash += x[Math.floor(Math.random() * x.length)]
  return hash
}

function incrementMarginal(table, key, value) {
  if (!table[key]) table[key] = {}
  const label = value === null || value === undefined ? 'null' : String(value)
  table[key][label] = (table[key][label] || 0) + 1
}

function summarizeRarity(records) {
  const keys = [
    'Enumerative Rarity Magnitude',
    'Programmed Rarity Magnitude',
    'Spatial Possibility Magnitude',
    'Programmed Rarity Skew',
    'Total Possibility Magnitude',
  ]
  const summary = {}
  keys.forEach(k => { summary[k] = {} })
  records.forEach(row => {
    keys.forEach(k => incrementMarginal(summary, k, row.publicFeatures[k]))
  })
  return summary
}

function bucketByGridStyle(records) {
  const buckets = {}
  records.forEach(row => {
    const style = row.publicFeatures['Grid Style']
    if (!buckets[style]) buckets[style] = []
    buckets[style].push(row)
  })
  return buckets
}

function unreachableOptionReport(records) {
  const seen = {}
  records.forEach(row => {
    row.usageStore.filter(r => r.contributesToRarity).forEach(rec => {
      if (!seen[rec.name]) seen[rec.name] = { chosen: new Set(), maxModifiedCount: 0 }
      seen[rec.name].chosen.add(rec.chosen)
      seen[rec.name].maxModifiedCount = Math.max(seen[rec.name].maxModifiedCount, rec.modifiedOptionCount)
    })
  })
  return Object.fromEntries(Object.entries(seen).map(([name, info]) => [
    name,
    { uniqueChoices: [...info.chosen].sort(), maxModifiedOptionCount: info.maxModifiedCount },
  ]))
}

function toCsvRows(records) {
  if (!records.length) return ''
  const keys = Object.keys(records[0].publicFeatures)
  const header = ['hash', ...keys].join(',')
  const rows = records.map(row => {
    const vals = keys.map(k => {
      const v = row.publicFeatures[k]
      const s = v === null || v === undefined ? '' : String(v)
      return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s
    })
    return [row.hash, ...vals].join(',')
  })
  return [header, ...rows].join('\n')
}

function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * @param {object} options
 * @param {number} [options.count=5000]
 * @param {boolean} [options.useLastHash=false] — sample from lastHash corpus when available
 * @param {number} [options.lastHashStart=0]
 * @param {boolean} [options.exportCsv=false]
 * @param {boolean} [options.exportJson=false]
 */
function runFeatureBatchAnalyzer(options = {}) {
  const count = options.count ?? 5000
  const useLastHash = options.useLastHash ?? false
  const lastHashStart = options.lastHashStart ?? 0
  const t0 = performance.now()
  const records = []
  const marginals = {}

  for (let i = 0; i < count; i++) {
    let hash
    if (useLastHash && typeof lastHash !== 'undefined' && lastHash[lastHashStart + i]) {
      hash = lastHash[lastHashStart + i]
    } else {
      hash = randomAnalyzerHash()
    }
    tokenData.hash = hash
    R = new Random()
    const features = new FeatureSet(R)
    const publicFeatures = { ...features.publicFeatures }
    records.push({ hash, publicFeatures, usageStore: features.usageStore.slice() })
    Object.entries(publicFeatures).forEach(([k, v]) => incrementMarginal(marginals, k, v))
  }

  const report = {
    count: records.length,
    elapsedMs: Math.round(performance.now() - t0),
    marginals,
    raritySummary: summarizeRarity(records),
    gridStyleBuckets: Object.fromEntries(
      Object.entries(bucketByGridStyle(records)).map(([k, rows]) => [k, rows.length])
    ),
    conditionalByGridStyle: Object.fromEntries(
      Object.entries(bucketByGridStyle(records)).map(([style, rows]) => {
        const sub = {}
        rows.forEach(row => incrementMarginal(sub, 'Group Density', row.publicFeatures['Group Density']))
        return [style, sub['Group Density'] || {}]
      })
    ),
    unreachable: unreachableOptionReport(records),
    records: options.includeRecords ? records : undefined,
  }

  console.log(`FeatureBatchAnalyzer: ${report.count} hashes in ${report.elapsedMs}ms`)
  console.table(report.gridStyleBuckets)
  console.log('Rarity summary:', report.raritySummary)

  if (options.exportJson) downloadText('feature-batch-report.json', JSON.stringify(report, null, 2), 'application/json')
  if (options.exportCsv) downloadText('feature-batch.csv', toCsvRows(records), 'text/csv')

  return report
}

window.runFeatureBatchAnalyzer = runFeatureBatchAnalyzer
