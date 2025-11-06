import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["sidebar", "overlay"]

  connect() {
    this.updateSidebarVisibility()
    window.addEventListener('resize', () => this.updateSidebarVisibility())
  }

  disconnect() {
    window.removeEventListener('resize', () => this.updateSidebarVisibility())
  }

  toggle() {
    this.sidebarTarget.classList.toggle('-translate-x-full')
    this.overlayTarget.classList.toggle('hidden')
  }

  updateSidebarVisibility() {
    if (window.innerWidth >= 768) { // md breakpoint
      this.sidebarTarget.classList.remove('-translate-x-full')
      this.overlayTarget.classList.add('hidden')
    } else {
      this.sidebarTarget.classList.add('-translate-x-full')
    }
  }
}