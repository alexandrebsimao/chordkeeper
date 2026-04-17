class AddBillingFieldsToPlansAndSubscriptions < ActiveRecord::Migration[8.1]
  def change
    add_column :plans, :description, :text unless column_exists?(:plans, :description)
    add_column :plans, :duration_days, :integer, default: 30, null: false unless column_exists?(:plans, :duration_days)

    add_column :user_subscriptions, :customer_name, :string unless column_exists?(:user_subscriptions, :customer_name)
    add_column :user_subscriptions, :customer_document, :string unless column_exists?(:user_subscriptions, :customer_document)
    add_column :user_subscriptions, :customer_phone, :string unless column_exists?(:user_subscriptions, :customer_phone)

    add_column :user_subscriptions, :payment_method_brand, :string unless column_exists?(:user_subscriptions, :payment_method_brand)
    add_column :user_subscriptions, :payment_method_last4, :string unless column_exists?(:user_subscriptions, :payment_method_last4)
    add_column :user_subscriptions, :payment_method_token, :string unless column_exists?(:user_subscriptions, :payment_method_token)

    add_index :user_subscriptions, :status unless index_exists?(:user_subscriptions, :status)
    add_index :user_subscriptions, :external_subscription_id unless index_exists?(:user_subscriptions, :external_subscription_id)
  end
end
