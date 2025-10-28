class AddConvertPdfToSong < ActiveRecord::Migration[8.0]
  def change
    add_column :songs, :convert_pdf, :boolean, default: false, null: false
  end
end
