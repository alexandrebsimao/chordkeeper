import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["template", "target"]

  connect() {
    console.log("NestedForm controller connected")
  }

  add(event) {
    event.preventDefault()
    console.log("Adding new nested form")
    
    const content = this.templateTarget.innerHTML.replace(/NEW_RECORD/g, new Date().getTime())
    this.targetTarget.insertAdjacentHTML('beforeend', content)
    
    // Re-initialize Stimulus controllers in the new content
    const newField = this.targetTarget.lastElementChild
    this.application.controllers.forEach(controller => {
      if (controller.element === newField) {
        controller.connect()
      }
    })
  }

  remove(event) {
    event.preventDefault()
    console.log("Removing nested form")
    
    const wrapper = event.target.closest('.nested-fields')
    
    if (wrapper.dataset.newRecord) {
      wrapper.remove()
    } else {
      // Se for um registro existente, marca para destruição e esconde
      const destroyField = wrapper.querySelector('input[name*="_destroy"]')
      if (destroyField) {
        destroyField.value = '1'
        wrapper.style.display = 'none'
      } else {
        wrapper.remove()
      }
    }
  }
}