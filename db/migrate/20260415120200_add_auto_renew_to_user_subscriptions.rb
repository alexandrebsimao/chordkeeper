class AddAutoRenewToUserSubscriptions < ActiveRecord::Migration[7.1]
  def change
    add_column :user_subscriptions, :auto_renew, :boolean, default: true, null: false
    add_column :user_subscriptions, :last_renewed_at, :datetime
    add_column :user_subscriptions, :provider_customer_id, :string
    
    add_index :user_subscriptions, :auto_renew
  end
end
