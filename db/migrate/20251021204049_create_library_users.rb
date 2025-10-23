class CreateLibraryUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :library_users do |t|
      t.references :user, null: false, foreign_key: true
      t.references :library, null: false, foreign_key: true
      # t.string :role, null: false, default: "admin"

      t.timestamps
    end
  end
end
