// PDF report generation. Dynamically imported by UI components (never loaded at
// module-init time) so jsPDF doesn't affect test environments or initial bundle.
//
// Design goals:
//  - Reuses shared math/locale/chart utilities → stays in sync with the app automatically
//  - Print-friendly: white background, no heavy fills, readable in B&W
//  - A4 portrait, 2 spider charts per page, items section as plain text

import jsPDF from 'jspdf'
import { buildSpiderSvg } from './spiderSvg'
import { enabledItemsForCat, isGrCat } from '@/lib/charts/items'
import { CATEGORIES } from '@/lib/data/data'
import { getItemLabel, localizeStep } from '@/lib/data/locale'
import { fmtDate } from '@/lib/format/date'
import { t } from '@/lib/i18n/i18n'
import type { ChartDataset } from '@/components/charts/types'
import type { AnswerCell, CustomItemDef } from '@/lib/storage/types'
import type { MutableScaleStep } from '@/lib/data/types'

// ── Layout constants ──────────────────────────────────────────────────────────

const A4_W = 210
const A4_H = 297
const ML = 20  // margin left
const MR = 20  // margin right
const MT = 20  // margin top
const MB = 20  // margin bottom
const CW = A4_W - ML - MR   // content width = 170mm
const CH = A4_H - MT - MB   // content height = 257mm

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  if (isNaN(n)) return [120, 100, 180]
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

// ── Answer check ─────────────────────────────────────────────────────────────

function datasetsHaveAnswers(datasets: readonly ChartDataset[]): boolean {
  for (const ds of datasets) {
    for (const slot of Object.values(ds.answers ?? {})) {
      if (!slot || typeof slot !== 'object') continue
      for (const k of Object.keys(slot)) {
        if (k === '__hidden') continue
        if (k === '__custom') {
          for (const cell of Object.values(slot.__custom ?? {})) {
            const c = cell as AnswerCell
            if (c?.giving || c?.receiving) return true
            if (c?.scale && c.scale !== 'open') return true
            if ((c as unknown as { textValue?: string })?.textValue) return true
            if (((c as unknown as { selectedValues?: string[] })?.selectedValues?.length ?? 0) > 0) return true
            if (((c as unknown as { rankingValues?: string[] })?.rankingValues?.length ?? 0) > 0) return true
          }
          continue
        }
        const baseCell = (slot as Record<string, AnswerCell | undefined>)[k]
        if (baseCell?.scale || baseCell?.giving || baseCell?.receiving) return true
      }
    }
  }
  return false
}

// ── SVG → PNG conversion ──────────────────────────────────────────────────────

async function svgToPng(svgString: string, px: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = px
      canvas.height = px
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no canvas')); return }
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, px, px)
      ctx.drawImage(img, 0, 0, px, px)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg load failed')) }
    img.src = url
  })
}

// ── Answer formatting ─────────────────────────────────────────────────────────

function getScaleAnswer(
  cell: AnswerCell | undefined,
  scale: readonly MutableScaleStep[],
  lang: string,
  isCustom: boolean,
): string | null {
  if (!cell) return null
  if (isCustom && (!cell.scale || cell.scale === 'open')) return null
  if (!cell.scale) return null
  const step = scale.find((s) => s.key === cell.scale)
  if (!step) return null
  return localizeStep(step, lang).label
}

function getGrSideAnswer(
  cell: AnswerCell | undefined,
  side: 'giving' | 'receiving',
  scale: readonly MutableScaleStep[],
  lang: string,
): string | null {
  if (!cell) return null
  let scaleKey: string | undefined
  if (side === 'giving') {
    scaleKey = cell.giving ?? (cell.gr === 'G' || cell.gr === 'Both' ? cell.scale : undefined)
  } else {
    scaleKey = cell.receiving ?? (cell.gr === 'R' || cell.gr === 'Both' ? cell.scale : undefined)
  }
  if (!scaleKey) return null
  const step = scale.find((s) => s.key === scaleKey)
  return step ? localizeStep(step, lang).label : null
}

function formatNonScaleAnswer(cell: AnswerCell | undefined, def: CustomItemDef): string | null {
  if (!cell) return null
  if (def.format === 'text') return (cell as unknown as { textValue?: string }).textValue ?? null
  if (def.format === 'single' || def.format === 'multi') {
    const vals = (cell as unknown as { selectedValues?: string[] }).selectedValues
    return vals && vals.length > 0 ? vals.join(', ') : null
  }
  if (def.format === 'ranking') {
    const vals = (cell as unknown as { rankingValues?: string[] }).rankingValues
    return vals && vals.length > 0 ? vals.map((v, i) => `${i + 1}. ${v}`).join(' · ') : null
  }
  return null
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface GenerateReportOptions {
  datasets: readonly ChartDataset[]
  /** Ordered category IDs to include (caller applies enabledCategories filtering). */
  categoryIds: string[]
  lang: string
  filename?: string
}

/**
 * Generates and downloads a PDF report.
 * Returns false if the datasets have no answers (caller should show a warning).
 */
export async function generatePdfReport({
  datasets,
  categoryIds,
  lang,
  filename = 'relationshapes-report.pdf',
}: GenerateReportOptions): Promise<boolean> {
  if (!datasetsHaveAnswers(datasets)) return false

  const isMulti = datasets.length > 1
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  // ── Cover page ──────────────────────────────────────────────────────────────
  {
    let y = MT + 15

    // App name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.setTextColor(35, 30, 65)
    doc.text('Relationshapes', ML, y)
    y += 8

    // Thin rule
    doc.setDrawColor(190, 175, 220)
    doc.setLineWidth(0.4)
    doc.line(ML, y, A4_W - MR, y)
    y += 10

    // Report type
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(110, 100, 145)
    const reportTypeLabel = isMulti
      ? (lang === 'de' ? 'Vergleichsbericht' : 'Comparison Report')
      : (lang === 'de' ? 'Beziehungskarte – Bericht' : 'Relationship Map – Report')
    doc.text(reportTypeLabel, ML, y)
    y += 14

    // Dataset names with colored dots
    for (const ds of datasets) {
      const [r, g, b] = hexToRgb(ds.color)
      doc.setFillColor(r, g, b)
      doc.circle(ML + 2.5, y - 2, 2.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(30, 25, 60)
      const nameLines = doc.splitTextToSize(ds.name, CW - 8) as string[]
      doc.text(nameLines, ML + 8, y)
      y += nameLines.length * 5.5 + 3
    }
    y += 6

    // Date
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(140, 130, 165)
    doc.text(`${t('pdf_cover_generated_on')}: ${fmtDate(Date.now())}`, ML, y)
  }

  // ── Spider chart pages (2 per A4 page) ─────────────────────────────────────
  const SVG_PX = 700            // render size in pixels (high-res for clarity)
  const CHART_MM = 82           // square chart side in mm
  const LEGEND_X = ML + CHART_MM + 8
  const LEGEND_W = A4_W - MR - LEGEND_X
  const SECTION_H = (CH - 10) / 2   // ~123.5mm per section
  const GAP = CH - SECTION_H * 2    // separator gap (~10mm)

  // Filter to categories that the spider chart would show (answeredItemCount >= 2)
  const spiderCats: Array<{ catId: string; title: string; pngData: string; scale: readonly MutableScaleStep[] }> = []

  for (const catId of categoryIds) {
    const catObj = CATEGORIES.find((c) => c.id === catId)
    const customCat = datasets.flatMap((ds) => ds.customCategories ?? []).find((c) => c.id === catId)
    const baseTitle = (lang === 'de' && catObj?.de ? catObj.de : catObj?.title)
      ?? customCat?.title
      ?? catId

    if (isGrCat(catId)) {
      for (const grSide of ['giving', 'receiving'] as const) {
        const result = buildSpiderSvg(datasets, catId, SVG_PX, lang, grSide)
        if (!result || result.answeredItemCount < 2 || !result.svg) continue
        const sideLabel = grSide === 'giving' ? String(t('lbl_giving')) : String(t('lbl_receiving'))
        const title = `${baseTitle} – ${sideLabel}`
        let pngData: string
        try { pngData = await svgToPng(result.svg, SVG_PX) } catch { continue }
        spiderCats.push({ catId, title, pngData, scale: datasets[0]!.scale })
      }
    } else {
      const result = buildSpiderSvg(datasets, catId, SVG_PX, lang)
      if (!result || result.answeredItemCount < 2 || !result.svg) continue
      let pngData: string
      try { pngData = await svgToPng(result.svg, SVG_PX) } catch { continue }
      spiderCats.push({ catId, title: baseTitle, pngData, scale: datasets[0]!.scale })
    }
  }

  for (let i = 0; i < spiderCats.length; i++) {
    const isFirstOnPage = i % 2 === 0
    if (isFirstOnPage) doc.addPage()

    const cat = spiderCats[i]!
    const sTop = MT + (isFirstOnPage ? 0 : SECTION_H + GAP)

    // Category title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(40, 35, 75)
    doc.text(cat.title, ML, sTop + 7)

    // Spider chart image
    doc.addImage(cat.pngData, 'PNG', ML, sTop + 10, CHART_MM, CHART_MM)

    // Scale legend (right of chart)
    let ly = sTop + 12
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(110, 100, 140)
    doc.text(t('pdf_scale_legend'), LEGEND_X, ly)
    ly += 5

    // Dataset colour labels (only in compare mode)
    if (isMulti) {
      for (const ds of datasets) {
        const [r, g, b] = hexToRgb(ds.color)
        doc.setFillColor(r, g, b)
        doc.circle(LEGEND_X + 1.8, ly - 1.3, 1.8, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(40, 35, 70)
        const nameLines = doc.splitTextToSize(ds.name, LEGEND_W - 5) as string[]
        doc.text(nameLines[0]!, LEGEND_X + 5, ly)
        ly += 4.2
      }
      ly += 2
    }

    // Scale steps
    for (const step of cat.scale) {
      const loc = localizeStep(step, lang)
      const [r, g, b] = hexToRgb(step.color)
      doc.setFillColor(r, g, b)
      doc.circle(LEGEND_X + 1.8, ly - 1.3, 1.8, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(40, 35, 70)
      const labelLines = doc.splitTextToSize(loc.label, LEGEND_W - 5) as string[]
      doc.text(labelLines[0]!, LEGEND_X + 5, ly)
      ly += 4.5
      if (ly > sTop + SECTION_H - 4) break
    }

    // Separator between sections (only between #1 and #2 on the same page)
    if (isFirstOnPage && i + 1 < spiderCats.length) {
      const sepY = MT + SECTION_H + GAP / 2
      doc.setDrawColor(215, 205, 230)
      doc.setLineWidth(0.25)
      doc.line(ML, sepY, A4_W - MR, sepY)
    }
  }

  // ── Items section (Element für Element) ────────────────────────────────────
  // Collect categories that have at least one answered item
  const itemCatIds = categoryIds.filter((catId) =>
    datasets.some((ds) => {
      const slot = ds.answers[catId]
      if (!slot) return false
      const { base, custom } = enabledItemsForCat(ds.answers, catId)
      return (
        base.some((item) => {
          const c = slot[item]
          return !!(c?.scale || c?.giving || c?.receiving)
        }) ||
        custom.some((item) => {
          const cell = slot.__custom?.[item]
          if (!cell) return false
          const def = ds.customItemDefs?.[catId]?.[item]
          if (!def || def.format === 'scale') return !!(cell.scale && cell.scale !== 'open')
          if (def.format === 'text') return !!(cell as unknown as { textValue?: string }).textValue
          const sv = (cell as unknown as { selectedValues?: string[] }).selectedValues
          const rv = (cell as unknown as { rankingValues?: string[] }).rankingValues
          return (sv?.length ?? 0) > 0 || (rv?.length ?? 0) > 0
        })
      )
    }),
  )

  if (itemCatIds.length === 0) {
    doc.save(filename)
    return true
  }

  doc.addPage()

  let y = MT

  // Section heading
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(35, 30, 65)
  doc.text(t('pdf_items_section'), ML, y + 10)
  y += 18

  doc.setDrawColor(185, 170, 215)
  doc.setLineWidth(0.4)
  doc.line(ML, y, A4_W - MR, y)
  y += 8

  function checkBreak(needed: number) {
    if (y + needed > A4_H - MB) {
      doc.addPage()
      y = MT
    }
  }

  for (const catId of itemCatIds) {
    const catObj = CATEGORIES.find((c) => c.id === catId)
    const customCat = datasets.flatMap((ds) => ds.customCategories ?? []).find((c) => c.id === catId)
    const catTitle = (lang === 'de' && catObj?.de ? catObj.de : catObj?.title)
      ?? customCat?.title
      ?? catId

    checkBreak(16)

    // Category heading
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(55, 50, 95)
    doc.text(catTitle, ML, y)
    y += 3
    doc.setDrawColor(205, 195, 225)
    doc.setLineWidth(0.25)
    doc.line(ML, y, A4_W - MR, y)
    y += 5.5

    // Collect all items for this category across all datasets
    const baseItems = new Set<string>()
    const customItems = new Set<string>()
    for (const ds of datasets) {
      const { base, custom } = enabledItemsForCat(ds.answers, catId)
      base.forEach((item) => baseItems.add(item))
      custom.forEach((item) => customItems.add(item))
    }

    const grCategory = isGrCat(catId)

    function renderItem(itemKey: string, isCustom: boolean) {
      const def0 = isCustom ? datasets[0]?.customItemDefs?.[catId]?.[itemKey] : undefined
      const itemIsGr = grCategory && (!def0 || def0.format === 'scale')

      // Check if any dataset has an answer for this item
      const hasAny = datasets.some((ds) => {
        const cell = isCustom ? ds.answers[catId]?.__custom?.[itemKey] : ds.answers[catId]?.[itemKey]
        if (!cell) return false
        if (itemIsGr) return !!(cell.giving || cell.receiving || cell.gr)
        const def = isCustom ? ds.customItemDefs?.[catId]?.[itemKey] : undefined
        if (!def || def.format === 'scale') return !!(cell.scale && (!isCustom || cell.scale !== 'open'))
        if (def.format === 'text') return !!(cell as unknown as { textValue?: string }).textValue
        const sv = (cell as unknown as { selectedValues?: string[] }).selectedValues
        const rv = (cell as unknown as { rankingValues?: string[] }).rankingValues
        return (sv?.length ?? 0) > 0 || (rv?.length ?? 0) > 0
      })
      if (!hasAny) return

      const itemLabel = isCustom ? itemKey : getItemLabel(catId, itemKey, lang)
      const prefix = isCustom ? '* ' : ''

      checkBreak(isMulti ? 7 + datasets.length * (itemIsGr ? 9 : 4.5) : 10)

      // Item name
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(30, 25, 55)
      const labelLines = doc.splitTextToSize(prefix + itemLabel, CW - 2) as string[]
      doc.text(labelLines, ML + 2, y)
      y += labelLines.length * 4.2

      const indent = ML + 6
      const availW = CW - 6

      // Answers per dataset
      for (const ds of datasets) {
        const cell = isCustom ? ds.answers[catId]?.__custom?.[itemKey] : ds.answers[catId]?.[itemKey]
        const def = isCustom ? ds.customItemDefs?.[catId]?.[itemKey] : undefined

        checkBreak(itemIsGr ? 9 : 5)

        if (isMulti) {
          const [r, g, b] = hexToRgb(ds.color)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(r, g, b)
          const dsNameText = ds.name + ': '
          const dsNameW = doc.getTextWidth(dsNameText)
          doc.text(dsNameText, indent, y)
          doc.setTextColor(50, 45, 75)

          if (itemIsGr) {
            const givingLabel = getGrSideAnswer(cell, 'giving', ds.scale, lang) ?? String(t('pdf_no_answer'))
            const receivingLabel = getGrSideAnswer(cell, 'receiving', ds.scale, lang) ?? String(t('pdf_no_answer'))
            const gPrefix = String(t('lbl_giving')) + ': '
            const rPrefix = String(t('lbl_receiving')) + ': '
            doc.text(gPrefix + givingLabel, indent + dsNameW, y)
            y += 4
            doc.text(rPrefix + receivingLabel, indent + dsNameW, y)
            y += 3.8
          } else {
            let answer: string | null
            if (def && def.format !== 'scale') {
              answer = formatNonScaleAnswer(cell, def)
            } else {
              answer = getScaleAnswer(cell, ds.scale, lang, isCustom)
            }
            const answerText = answer ?? String(t('pdf_no_answer'))
            const answerLines = doc.splitTextToSize(answerText, availW - dsNameW) as string[]
            doc.text(answerLines, indent + dsNameW, y)
            y += answerLines.length * 3.8
          }
        } else {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(60, 55, 90)

          if (itemIsGr) {
            const givingLabel = getGrSideAnswer(cell, 'giving', ds.scale, lang) ?? String(t('pdf_no_answer'))
            const receivingLabel = getGrSideAnswer(cell, 'receiving', ds.scale, lang) ?? String(t('pdf_no_answer'))
            const gPrefix = String(t('lbl_giving')) + ': '
            const rPrefix = String(t('lbl_receiving')) + ': '
            doc.text(gPrefix + givingLabel, indent, y)
            y += 4.2
            doc.text(rPrefix + receivingLabel, indent, y)
            y += 4
          } else {
            let answer: string | null
            if (def && def.format !== 'scale') {
              answer = formatNonScaleAnswer(cell, def)
            } else {
              answer = getScaleAnswer(cell, ds.scale, lang, isCustom)
            }
            const answerLines = doc.splitTextToSize(answer ?? String(t('pdf_no_answer')), availW) as string[]
            doc.text(answerLines, indent, y)
            y += answerLines.length * 4
          }
        }
      }

      y += 2.5
    }

    for (const item of baseItems) renderItem(item, false)
    for (const item of customItems) renderItem(item, true)
    y += 4
  }

  doc.save(filename)
  return true
}
