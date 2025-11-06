class CreateMediaReferences < ActiveRecord::Migration[8.0]
  def change
    create_table :media_references do |t|
      t.string :media_type
      t.string :url
      t.string :description
      t.references :song, null: false, foreign_key: true

      t.timestamps
    end
  end
end
