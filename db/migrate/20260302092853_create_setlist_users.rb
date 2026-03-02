class CreateSetlistUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :setlist_users do |t|
      t.references :user, null: false, foreign_key: true
      t.references :setlist, null: false, foreign_key: true
      t.string :role, null: false, default: "read_only"

      t.timestamps
    end

    add_index :setlist_users, [:user_id, :setlist_id], unique: true
  end
end
