class CreateSongs < ActiveRecord::Migration[8.0]
  def change
    create_table :songs do |t|
      t.string :title
      t.string :artist
      t.string :genre
      t.string :key
      t.integer :bpm
      t.text :content
      t.references :library, null: false, foreign_key: true

      t.timestamps
    end
  end
end
