class CreateSongs < ActiveRecord::Migration[8.0]
  def change
    create_table :songs do |t|
      t.string :title
      t.string :artist
      t.string :album
      t.string :genre
      t.string :key
      t.integer :bpm
      t.string :duration
      t.text :content
      t.string :content_type
      t.string :attachment
      t.references :library, null: false, foreign_key: true

      t.timestamps
    end
  end
end
