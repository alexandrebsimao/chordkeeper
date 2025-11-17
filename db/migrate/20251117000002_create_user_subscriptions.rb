class CreateUserSubscriptions < ActiveRecord::Migration[8.0]
  def change
    create_table :user_subscriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :plan, null: false, foreign_key: true
      t.string :status, default: 'active', null: false # active, cancelled, expired, trial
      t.datetime :started_at
      t.datetime :expires_at
      t.datetime :cancelled_at
      t.string :payment_provider # stripe, paypal, manual, etc
      t.string :external_subscription_id

      t.timestamps
    end

    add_index :user_subscriptions, [:user_id, :status]
    add_index :user_subscriptions, :expires_at
  end
end
