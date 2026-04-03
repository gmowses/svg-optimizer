import { useState, useCallback } from 'react'
import { Sun, Moon, Languages, Copy, Check, Download, Minimize2, Code2 } from 'lucide-react'

const translations = {
  en: {
    title: 'SVG Optimizer',
    subtitle: 'Paste SVG, remove metadata/comments/editor tags, minify and compare size.',
    inputLabel: 'Input SVG',
    outputLabel: 'Optimized SVG',
    inputPlaceholder: 'Paste your SVG code here...',
    optimize: 'Optimize',
    clear: 'Clear',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download',
    originalSize: 'Original',
    optimizedSize: 'Optimized',
    saved: 'Saved',
    preview: 'Preview',
    noOutput: 'Paste SVG above and click "Optimize"',
    noPreview: 'Optimized SVG will appear here',
    removedTags: 'Removed elements',
    builtBy: 'Built by',
  },
  pt: {
    title: 'Otimizador de SVG',
    subtitle: 'Cole SVG, remova metadados/comentarios/tags de editor, minifique e compare o tamanho.',
    inputLabel: 'SVG de entrada',
    outputLabel: 'SVG Otimizado',
    inputPlaceholder: 'Cole seu codigo SVG aqui...',
    optimize: 'Otimizar',
    clear: 'Limpar',
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar',
    originalSize: 'Original',
    optimizedSize: 'Otimizado',
    saved: 'Economizado',
    preview: 'Previsualizar',
    noOutput: 'Cole SVG acima e clique em "Otimizar"',
    noPreview: 'SVG otimizado aparecera aqui',
    removedTags: 'Elementos removidos',
    builtBy: 'Criado por',
  }
} as const

type Lang = keyof typeof translations

interface OptimizeResult {
  output: string
  originalSize: number
  optimizedSize: number
  removedTags: string[]
}

function optimizeSVG(input: string): OptimizeResult {
  let svg = input.trim()
  const removedTags: string[] = []
  const originalSize = new Blob([svg]).size

  // Remove XML declaration
  svg = svg.replace(/<\?xml[^?]*\?>/gi, () => { removedTags.push('<?xml>'); return '' })

  // Remove DOCTYPE
  svg = svg.replace(/<!DOCTYPE[^>]*>/gi, () => { removedTags.push('DOCTYPE'); return '' })

  // Remove HTML comments
  svg = svg.replace(/<!--[\s\S]*?-->/g, () => { removedTags.push('<!-- comment -->'); return '' })

  // Remove metadata tags
  svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, () => { removedTags.push('<metadata>'); return '' })
  svg = svg.replace(/<desc[\s\S]*?<\/desc>/gi, () => { removedTags.push('<desc>'); return '' })
  svg = svg.replace(/<title[\s\S]*?<\/title>/gi, () => { removedTags.push('<title>'); return '' })

  // Remove common editor-specific tags (Inkscape, Adobe Illustrator, Sketch)
  svg = svg.replace(/<sodipodi:[^>]*(?:\/>|>[\s\S]*?<\/sodipodi:[^>]*>)/gi, () => { removedTags.push('<sodipodi:*>'); return '' })
  svg = svg.replace(/<inkscape:[^>]*(?:\/>|>[\s\S]*?<\/inkscape:[^>]*>)/gi, () => { removedTags.push('<inkscape:*>'); return '' })

  // Remove editor-specific namespaces from SVG tag
  svg = svg.replace(/\s+xmlns:sodipodi="[^"]*"/gi, '')
  svg = svg.replace(/\s+xmlns:inkscape="[^"]*"/gi, '')
  svg = svg.replace(/\s+xmlns:sketch="[^"]*"/gi, '')
  svg = svg.replace(/\s+xmlns:xlink="[^"]*"/gi, () => { removedTags.push('xmlns:xlink'); return '' })
  svg = svg.replace(/\s+xmlns:dc="[^"]*"/gi, '')
  svg = svg.replace(/\s+xmlns:cc="[^"]*"/gi, '')
  svg = svg.replace(/\s+xmlns:rdf="[^"]*"/gi, '')

  // Remove inkscape/sodipodi attributes from elements
  svg = svg.replace(/\s+(?:inkscape|sodipodi):[a-zA-Z-]+=(?:"[^"]*"|'[^']*')/gi, '')

  // Remove empty id attributes
  svg = svg.replace(/\s+id=""/gi, '')

  // Minify: remove unnecessary whitespace between tags
  svg = svg.replace(/>\s+</g, '><')

  // Remove leading/trailing whitespace in attribute values
  svg = svg.replace(/="\s+/g, '="').replace(/\s+"/g, '"')

  // Remove multiple spaces
  svg = svg.replace(/\s{2,}/g, ' ')

  // Remove newlines
  svg = svg.replace(/\n\s*/g, ' ')

  svg = svg.trim()

  const optimizedSize = new Blob([svg]).size
  return { output: svg, originalSize, optimizedSize, removedTags: [...new Set(removedTags)] }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function SvgOptimizer() {
  const [lang, setLang] = useState<Lang>(() => navigator.language.startsWith('pt') ? 'pt' : 'en')
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [copied, setCopied] = useState(false)

  const t = translations[lang]

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark)
  }

  const handleOptimize = useCallback(() => {
    if (!input.trim()) return
    setResult(optimizeSVG(input))
  }, [input])

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result.output], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'optimized.svg'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const savedPct = result ? Math.round((1 - result.optimizedSize / result.originalSize) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Minimize2 size={18} className="text-white" />
            </div>
            <span className="font-semibold">SVG Optimizer</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/svg-optimizer" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Stats */}
          {result && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t.originalSize, value: formatBytes(result.originalSize), color: 'zinc' },
                { label: t.optimizedSize, value: formatBytes(result.optimizedSize), color: 'green' },
                { label: t.saved, value: `${savedPct}%`, color: savedPct > 0 ? 'green' : 'zinc' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{s.label}</p>
                  <p className={`text-xl font-bold tabular-nums ${s.color === 'green' ? 'text-green-500' : 'text-zinc-700 dark:text-zinc-300'}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <label className="font-semibold text-sm">{t.inputLabel}</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} rows={16} spellCheck={false} placeholder={t.inputPlaceholder}
                className="w-full font-mono text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div className="flex gap-2">
                <button onClick={handleOptimize} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors">
                  <Minimize2 size={15} />{t.optimize}
                </button>
                <button onClick={() => { setInput(''); setResult(null) }}
                  className="px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">{t.clear}</button>
              </div>
            </div>

            {/* Output */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{t.outputLabel}</span>
                {result && (
                  <div className="flex gap-1.5">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      {copied ? t.copied : t.copy}
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <Download size={12} />{t.download}
                    </button>
                  </div>
                )}
              </div>

              {result ? (
                <textarea readOnly value={result.output} rows={16}
                  className="w-full font-mono text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 resize-none focus:outline-none" />
              ) : (
                <div className="flex items-center justify-center min-h-[16rem] rounded-lg bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 text-sm">
                  {t.noOutput}
                </div>
              )}

              {result && result.removedTags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Code2 size={12} />{t.removedTags}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.removedTags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-mono">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {result && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <h2 className="font-semibold text-sm">{t.preview}</h2>
              <div className="flex items-center justify-center min-h-[120px] bg-zinc-50 dark:bg-zinc-800/30 rounded-lg p-4"
                dangerouslySetInnerHTML={{ __html: result.output }} />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-green-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
