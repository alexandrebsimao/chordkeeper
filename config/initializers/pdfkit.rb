# config/initializers/pdfkit.rb
PDFKit.configure do |config|
  config.wkhtmltopdf = '/path/to/wkhtmltopdf'
  config.default_options = {
    page_size: 'A4',
    encoding: 'UTF-8',
    print_media_type: true
  }

  # Use only if your external hostname is unavailable on the server.
  config.root_url = "http://localhost"
  config.verbose = false
end