class CreateSubscriptionNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :subscription_notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :user_subscription, null: false, foreign_key: true
      t.string :kind, null: false
      t.string :title, null: false
      t.text :message, null: false
      t.datetime :scheduled_for
      t.datetime :sent_at
      t.datetime :read_at
      t.jsonb :metadata, default: {}, null: false

      t.timestamps
    end

    add_index :subscription_notifications, [:user_id, :read_at]
    add_index :subscription_notifications, [:kind, :scheduled_for]
  end
end
