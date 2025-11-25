class AddIsCurrentScopeToLibraryUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :library_users, :is_current_scope, :boolean, default: false, null: false
    add_index :library_users, [:user_id, :is_current_scope], where: "is_current_scope = true", unique: true
  end
end
