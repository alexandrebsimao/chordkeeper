import { Controller } from "@hotwired/stimulus"

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

const formatPlainLine = (line) =>
  `<div class="lyrics-line" style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; white-space: pre; color: #1e293b;">${escapeHtml(line || "") || "&nbsp;"}</div>`

const formatChordLine = (line) => {
  const regex = /\[([^\]]+)\]([^\[]*)/g
  const segments = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ chord: null, text: line.slice(lastIndex, match.index) })
    }
    segments.push({ chord: match[1], text: match[2] || "" })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < line.length) {
    segments.push({ chord: null, text: line.slice(lastIndex) })
  }

  const hasChords = segments.some((segment) => segment.chord)
  if (!hasChords) return formatPlainLine(line)

  let chordsLine = ""
  let lyricsLine = ""
  const minSpacing = 2

  segments.forEach((segment) => {
    if (segment.chord) {
      const chordText = segment.chord
      const lyricText = segment.text

      chordsLine += chordText
      lyricsLine += lyricText

      if (lyricText.length > chordText.length) {
        chordsLine += " ".repeat(lyricText.length - chordText.length)
      } else {
        chordsLine += " ".repeat(minSpacing)
      }

      if (chordText.length > lyricText.length) {
        lyricsLine += " ".repeat(chordText.length - lyricText.length)
      } else {
        lyricsLine += " ".repeat(minSpacing)
      }
    } else {
      const text = segment.text || ""
      chordsLine += " ".repeat(text.length)
      lyricsLine += text
    }
  })

  const chordHtml = chordsLine.trim()
    ? `<div class="chord-line" style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; white-space: pre; color: #ec4899; font-weight: 700;">${escapeHtml(chordsLine.trimEnd())}</div>`
    : ""
  const lyricHtml = `<div class="lyrics-line" style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; white-space: pre; color: #1e293b;">${escapeHtml(lyricsLine.trimEnd()) || "&nbsp;"}</div>`

  return `${chordHtml}${lyricHtml}`
}

const renderChordPro = (value) => {
  const lines = (value || "").split("\n")
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

export default class extends Controller {
  static targets = ["textPanel", "filePanel", "tabText", "tabFile", "content", "preview"]

  connect() {
    this.boundInputHandler = this.renderPreview.bind(this)
    if (this.hasContentTarget) {
      this.contentTarget.addEventListener("input", this.boundInputHandler)
      this.contentTarget.addEventListener("keyup", this.boundInputHandler)
    }
    if (this.hasTextPanelTarget && this.hasFilePanelTarget && this.hasTabTextTarget && this.hasTabFileTarget) {
      this.showText()
    }
    this.renderPreview()
  }

  disconnect() {
    if (this.hasContentTarget && this.boundInputHandler) {
      this.contentTarget.removeEventListener("input", this.boundInputHandler)
      this.contentTarget.removeEventListener("keyup", this.boundInputHandler)
    }
  }

  showText(event) {
    if (event) event.preventDefault()
    if (!this.hasTextPanelTarget || !this.hasFilePanelTarget || !this.hasTabTextTarget || !this.hasTabFileTarget) return
    this.textPanelTarget.classList.remove("hidden")
    this.filePanelTarget.classList.add("hidden")
    this.tabTextTarget.classList.add("bg-sidebar-accent", "text-sidebar-primary")
    this.tabFileTarget.classList.remove("bg-sidebar-accent", "text-sidebar-primary")
  }

  showFile(event) {
    if (event) event.preventDefault()
    if (!this.hasTextPanelTarget || !this.hasFilePanelTarget || !this.hasTabTextTarget || !this.hasTabFileTarget) return
    this.filePanelTarget.classList.remove("hidden")
    this.textPanelTarget.classList.add("hidden")
    this.tabFileTarget.classList.add("bg-sidebar-accent", "text-sidebar-primary")
    this.tabTextTarget.classList.remove("bg-sidebar-accent", "text-sidebar-primary")
  }

  insertSnippet(event) {
    event.preventDefault()
    const snippet = event.currentTarget.dataset.snippet || ""
    const textarea = this.contentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    textarea.value = textarea.value.slice(0, start) + snippet + textarea.value.slice(end)
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
    textarea.focus()
    const pos = start + snippet.length
    textarea.setSelectionRange(pos, pos)
    this.renderPreview()
  }

  renderPreview() {
    if (!this.hasPreviewTarget || !this.hasContentTarget) return
    this.previewTarget.innerHTML = renderChordPro(this.contentTarget.value || "")
  }
}
