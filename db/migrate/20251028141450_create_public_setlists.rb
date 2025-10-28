class CreatePublicSetlists < ActiveRecord::Migration[8.0]
  def change
    create_table :public_setlists do |t|
      t.string :uuid
      t.references :setlist, null: false, foreign_key: true

      t.timestamps
    end
  end
end
