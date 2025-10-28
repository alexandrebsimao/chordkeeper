module ApplicationHelper
  def gerar_qr_code_svg(url_do_endereco)
    # 1. Cria a estrutura de dados do QR Code
    qrcode = RQRCode::QRCode.new(url_do_endereco)

    # 2. Renderiza em SVG
    # O método #as_svg é fornecido pela gem 'rqrcode-rails-svg'
    svg = qrcode.as_svg(
      offset: 0,
      color: '000',
      shape_rendering: 'crispEdges',
      module_size: 4, # Tamanho de cada módulo (quadradinho)
      standalone: true
    )

    # Retorna o código SVG como uma string
    return svg
  end
end
