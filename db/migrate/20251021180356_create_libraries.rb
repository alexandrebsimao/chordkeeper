class CreateLibraries < ActiveRecord::Migration[8.0]
  def change
    create_table :libraries do |t|
      t.string :name
      t.text :description

      t.timestamps
    end
  end
end
