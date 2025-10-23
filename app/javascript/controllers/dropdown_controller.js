import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu"]

  connect() {
    this.closeDropdownOnClickOutside = this.closeDropdownOnClickOutside.bind(this)
    document.addEventListener("click", this.closeDropdownOnClickOutside)
  }

  disconnect() {
    document.removeEventListener("click", this.closeDropdownOnClickOutside)
  }

  toggle(event) {
    event.stopPropagation()
    this.menuTarget.classList.toggle("hidden")
  }

  closeDropdownOnClickOutside(event) {
    if (!this.element.contains(event.target)) {
      this.menuTarget.classList.add("hidden")
    }
  }
}