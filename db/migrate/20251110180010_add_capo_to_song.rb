class AddCapoToSong < ActiveRecord::Migration[8.0]
  def change
    add_column :songs, :capo, :integer, default: 0, null: false
  end
end
