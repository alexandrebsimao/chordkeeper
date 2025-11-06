import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["urlField", "fileField"]

  connect() {
    console.log("MediaForm controller connected")
    this.initializeFields()
  }

  initializeFields() {
    const typeSelect = this.element.querySelector('select[name*="[type]"]')
    const referenceTypeSelect = this.element.querySelector('select[name*="[reference_type]"]')
    
    if (typeSelect) {
      const savedType = typeSelect.dataset.mediaFormTypeParam
      if (savedType) {
        typeSelect.value = savedType
        this.toggleFields({ target: typeSelect })
      }
    }

    if (referenceTypeSelect) {
      const savedReferenceType = referenceTypeSelect.dataset.mediaFormReferenceTypeParam
      if (savedReferenceType) {
        referenceTypeSelect.value = savedReferenceType
        this.toggleReferenceType({ target: referenceTypeSelect })
      }
    }
  }

  toggleFields(event) {
    console.log("Toggling fields for type", event.target.value)
    const selectedType = event.target.value
    const fileInput = this.fileFieldTarget.querySelector('input[type="file"]')
    
    if (fileInput) {
      if (selectedType === 'AudioReference') {
        fileInput.accept = '.mp3,.wav,.ogg,audio/*'
      } else if (['YoutubeReference', 'SpotifyReference'].includes(selectedType)) {
        fileInput.accept = 'video/*'
      }
    }
  }

  toggleReferenceType(event) {
    console.log("Toggling reference type", event.target.value)
    const selectedType = event.target.value
    
    this.hideAllFields()
    
    if (selectedType === 'url') {
      this.urlFieldTarget.classList.remove('hidden')
    } else if (selectedType === 'file') {
      this.fileFieldTarget.classList.remove('hidden')
    }
  }

  hideAllFields() {
    this.urlFieldTarget.classList.add('hidden')
    this.fileFieldTarget.classList.add('hidden')
  }
}