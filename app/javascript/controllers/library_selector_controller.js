import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "dropdown", "actions", "actionMenu"]

  connect() {
    this.closeMenusOnClickOutside = this.closeMenusOnClickOutside.bind(this)
    document.addEventListener("click", this.closeMenusOnClickOutside)
  }

  disconnect() {
    document.removeEventListener("click", this.closeMenusOnClickOutside)
  }

  toggleDropdown(event) {
    event.stopPropagation()
    this.dropdownTarget.classList.toggle("hidden")
    // Fecha o menu de ações se estiver aberto
    if (this.hasActionMenuTarget) {
      this.actionMenuTarget.classList.add("hidden")
    }
  }

  toggleActions(event) {
    event.stopPropagation()
    this.actionMenuTarget.classList.toggle("hidden")
    // Fecha o dropdown de bibliotecas se estiver aberto
    this.dropdownTarget.classList.add("hidden")
  }

  closeMenusOnClickOutside(event) {
    if(this.containerTarget !== undefined) {
      if (!this.containerTarget.contains(event.target) && 
          !this.actionsTarget.contains(event.target)) {
        this.dropdownTarget.classList.add("hidden")
        if (this.hasActionMenuTarget) {
          this.actionMenuTarget.classList.add("hidden")
        }
      }
    }
  }

  async deleteLibrary(event) {
    event.preventDefault()
    if (!confirm("Tem certeza que deseja excluir esta biblioteca?")) return

    const button = event.currentTarget
    const libraryId = button.dataset.libraryId

    try {
      const response = await fetch(`/libraries/${libraryId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })

      if (response.ok) {
        window.location.href = '/libraries'
      } else {
        console.error('Erro ao excluir biblioteca')
      }
    } catch (error) {
      console.error('Erro ao excluir biblioteca:', error)
    }
  }
}