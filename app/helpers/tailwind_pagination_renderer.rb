class TailwindPaginationRenderer < WillPaginate::ActionView::LinkRenderer
  def container_attributes
    { class: "flex items-center justify-center space-x-2 my-8" }
  end

  def page_number(page)
    if page == current_page
      tag(:span, page, class: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg")
    else
      link(page, page, class: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors")
    end
  end

  def previous_or_next_page(page, text, classname, aria_label = nil)
    if page
      link(text, page, class: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors")
    else
      tag(:span, text, class: "px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed")
    end
  end

  def html_container(html)
    tag(:nav, html, container_attributes.merge(role: "navigation", "aria-label": "Pagination"))
  end

  def gap
    tag(:span, "...", class: "px-4 py-2 text-sm font-medium text-gray-700")
  end
end