class CreateSetlists < ActiveRecord::Migration[8.0]
  def change
    create_table :setlists do |t|
      t.string :name
      t.text :description
      t.references :library, null: false, foreign_key: true

      t.timestamps
    end
  end
end
