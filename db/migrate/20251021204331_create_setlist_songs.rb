class CreateSetlistSongs < ActiveRecord::Migration[8.0]
  def change
    create_table :setlist_songs do |t|
      t.integer :position
      t.references :setlist, null: false, foreign_key: true
      t.references :song, null: false, foreign_key: true

      t.timestamps
    end
  end
end
