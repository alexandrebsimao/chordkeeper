const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

const CHORD_ONLY_LINE_REGEX = /^\s*(?:[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M)?(?:\d+)?(?:\([^)]*\))?(?:\/[A-G][#b]?)?\s+)+[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M)?(?:\d+)?(?:\([^)]*\))?(?:\/[A-G][#b]?)?\s*$/

const extractChordsWithPositions = (line) => {
  const chordRegex = /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M)?(?:\d+)?(?:\([^)]*\))?(?:\/[A-G][#b]?)?/g
  const chords = []
  let match
  while ((match = chordRegex.exec(line)) !== null) {
    chords.push({ chord: match[0], pos: match.index })
  }
  return chords
}

const mergeChordAndLyric = (chordLine, lyricLine) => {
  const chords = extractChordsWithPositions(chordLine)
  if (chords.length === 0) return lyricLine

  const insertions = {}
  const appended = []
  chords.forEach(({ chord, pos }) => {
    if (pos >= lyricLine.length) {
      appended.push(`[${chord}]`)
      return
    }
    if (!insertions[pos]) insertions[pos] = []
    insertions[pos].push(`[${chord}]`)
  })

  let out = ""
  for (let i = 0; i < lyricLine.length; i += 1) {
    if (insertions[i]) out += insertions[i].join("")
    out += lyricLine[i]
  }
  if (insertions[lyricLine.length]) out += insertions[lyricLine.length].join("")
  if (appended.length) out += ` ${appended.join(" ")}`
  return out
}

const normalizeToChordPro = (value) => {
  if ((value || "").includes("[")) return value || ""

  const lines = (value || "").split("\n")
  const output = []

  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i] || ""
    const next = lines[i + 1] || ""

    if (CHORD_ONLY_LINE_REGEX.test(current) && next.trim() && !next.includes("[")) {
      output.push(mergeChordAndLyric(current, next))
      i += 1
      continue
    }

    output.push(current)
  }

  return output.join("\n")
}

const formatPlainLine = (line) =>
  `<div class="lyrics-line" style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; white-space: pre; color: #1e293b;">${escapeHtml(line || "") || "&nbsp;"}</div>`

const formatChordLine = (line) => {
  const isTabLine = /^[A-Ga-g]\|/.test(line.trim()) || /[-]{3,}/.test(line)
  if (isTabLine) {
    return `<div class="lyrics-line" style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; white-space: pre; color: #1e293b;">${escapeHtml(line || "") || "&nbsp;"}</div>`
  }

  const regex = /\[([^\]]+)\]([^\[]*)/g
  const chords = []
  let lyricsText = ""
  let lastSourceIndex = 0
  let match

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastSourceIndex) {
      const plain = line.slice(lastSourceIndex, match.index)
      lyricsText += plain
    }
    chords.push({ text: match[1], pos: lyricsText.length })
    lyricsText += match[2] || ""
    lastSourceIndex = regex.lastIndex
  }

  if (lastSourceIndex < line.length) {
    lyricsText += line.slice(lastSourceIndex)
  }

  const hasChords = chords.length > 0
  if (!hasChords) return formatPlainLine(line)

  const chordSpans = chords
    .map((chord) => `<span style="position:absolute; left:${chord.pos}ch; top:0;">${escapeHtml(chord.text)}</span>`)
    .join("")

  const lyricsLine = lyricsText.replace(/\s+$/g, "")
  const lyricHtml = `<div class="lyrics-line" style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; white-space: pre; color: #1e293b;">${escapeHtml(lyricsLine) || "&nbsp;"}</div>`
  const chordHtml = `<div class="chord-line" style="position: relative; height: 1.4em; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; white-space: pre; color: #ec4899; font-weight: 700;">${chordSpans}</div>`

  return `<div style="margin-bottom: 8px;">${chordHtml}${lyricHtml}</div>`
}

const renderChordPro = (value) => {
  const normalized = normalizeToChordPro(value)
  const lines = normalized.split("\n")
  const htmlParts = []

  lines.forEach((rawLine) => {
    const line = rawLine || ""
    const trimmed = line.trim()

    if (/^\{start_of_(verse|chorus|bridge)\s*:?\s*([^}]*)\}$/i.test(trimmed)) {
      const [, type, title] = trimmed.match(/^\{start_of_(verse|chorus|bridge)\s*:?\s*([^}]*)\}$/i)
      const fallbackTitle = { verse: "Verso", chorus: "Refrão", bridge: "Ponte" }[type.toLowerCase()]
      const sectionTitle = (title || "").trim() || fallbackTitle
      htmlParts.push(`<div class="section-label" style="margin: 12px 0 6px 0;"><span style="display: inline-block; padding: 3px 12px; border-radius: 20px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-size: 11px; font-family: 'Courier New', monospace; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(sectionTitle)}</span></div>`)
      return
    }

    if (/^\{end_of_(verse|chorus|bridge)\}$/i.test(trimmed)) return
    if (/^\{.*\}$/.test(trimmed)) return

    htmlParts.push(formatChordLine(line))
  })

  if (htmlParts.length === 0) {
    return '<div class="lyrics-line" style="font-family: \'Courier New\', monospace; font-size: 14px; line-height: 1.4; white-space: pre; color: #1e293b;">&nbsp;</div>'
  }
  return `<div class="cifra-content">${htmlParts.join("")}</div>`
}

const renderPreview = (textarea, preview) => {
  preview.innerHTML = renderChordPro(textarea.value || "")
}

const initSongEditor = (root) => {
  if (!root || root.dataset.songEditorInitialized === "true") return

  const textarea = root.querySelector('[data-song-editor-fallback="content"]')
  const preview = root.querySelector('[data-song-editor-fallback="preview"]')
  const textPanel = root.querySelector('[data-song-editor-fallback="text-panel"]')
  const filePanel = root.querySelector('[data-song-editor-fallback="file-panel"]')
  const tabText = root.querySelector('[data-song-editor-fallback="tab-text"]')
  const tabFile = root.querySelector('[data-song-editor-fallback="tab-file"]')

  if (!textarea || !preview) return

  const showText = () => {
    textPanel?.classList.remove("hidden")
    filePanel?.classList.add("hidden")
    tabText?.classList.add("bg-sidebar-accent", "text-sidebar-primary")
    tabFile?.classList.remove("bg-sidebar-accent", "text-sidebar-primary")
  }

  const showFile = () => {
    filePanel?.classList.remove("hidden")
    textPanel?.classList.add("hidden")
    tabFile?.classList.add("bg-sidebar-accent", "text-sidebar-primary")
    tabText?.classList.remove("bg-sidebar-accent", "text-sidebar-primary")
  }

  tabText?.addEventListener("click", showText)
  tabFile?.addEventListener("click", showFile)

  root.querySelectorAll('[data-song-editor-fallback="insert-snippet"]').forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault()
      const snippet = button.dataset.snippet || ""
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      textarea.value = textarea.value.slice(0, start) + snippet + textarea.value.slice(end)
      textarea.focus()
      const pos = start + snippet.length
      textarea.setSelectionRange(pos, pos)
      renderPreview(textarea, preview)
    })
  })

  const update = () => renderPreview(textarea, preview)
  textarea.addEventListener("input", update)
  textarea.addEventListener("keyup", update)

  showText()
  update()
  root.dataset.songEditorInitialized = "true"
}

const initAllSongEditors = () => {
  document.querySelectorAll('[data-song-editor-fallback="root"]').forEach(initSongEditor)
}

document.addEventListener("turbo:load", initAllSongEditors)
document.addEventListener("DOMContentLoaded", initAllSongEditors)
