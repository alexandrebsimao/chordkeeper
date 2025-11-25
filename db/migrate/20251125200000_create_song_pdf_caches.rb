class CreateSongPdfCaches < ActiveRecord::Migration[8.0]
  def change
    create_table :song_pdf_caches do |t|
      t.references :song, null: false, foreign_key: true
      t.integer :font_size, null: false
      t.text :pdf_data, null: false
      
      t.timestamps
      
      t.index [:song_id, :font_size], unique: true
    end
  end
end
