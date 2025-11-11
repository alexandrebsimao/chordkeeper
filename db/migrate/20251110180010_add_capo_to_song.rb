class AddCapoToSong < ActiveRecord::Migration[8.0]
  def change
    add_column :songs, :capo, :integer, default: nil, null: true
  end
end
