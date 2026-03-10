# frozen_string_literal: true

class AddConfirmableToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :confirmation_token, :string
    add_column :users, :confirmed_at, :datetime
    add_column :users, :confirmation_sent_at, :datetime
    add_column :users, :unconfirmed_email, :string
    
    add_index :users, :confirmation_token, unique: true
    
    # Se você quiser confirmar automaticamente todos os usuários existentes, descomente:
    # User.update_all(confirmed_at: Time.current)
  end
end
