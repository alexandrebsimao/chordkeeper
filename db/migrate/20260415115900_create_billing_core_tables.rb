class CreateBillingCoreTables < ActiveRecord::Migration[8.1]
  def change
    create_table :plans, if_not_exists: true do |t|
      t.string :name, null: false
      t.integer :price_cents, null: false, default: 0
      t.string :interval, null: false, default: "month"
      t.text :features
      t.integer :max_songs
      t.integer :max_setlists
      t.integer :max_collaborators, default: 1
      t.boolean :active, null: false, default: true
      t.integer :sort_order, default: 0
      t.timestamps
    end

    add_index :plans, :name, unique: true, if_not_exists: true
    add_index :plans, :active, if_not_exists: true

    create_table :user_subscriptions, if_not_exists: true do |t|
      t.references :user, null: false, foreign_key: true
      t.references :plan, null: false, foreign_key: true
      t.string :status, null: false, default: "active"
      t.datetime :started_at
      t.datetime :expires_at
      t.datetime :cancelled_at
      t.string :payment_provider
      t.string :external_subscription_id
      t.timestamps
    end

    add_index :user_subscriptions, :expires_at, if_not_exists: true
    add_index :user_subscriptions, [:user_id, :status], if_not_exists: true

    create_table :feature_flags, if_not_exists: true do |t|
      t.string :key, null: false
      t.string :name, null: false
      t.text :description
      t.boolean :enabled, null: false, default: false
      t.text :allowed_plans
      t.text :config
      t.timestamps
    end

    add_index :feature_flags, :key, unique: true, if_not_exists: true
    add_index :feature_flags, :enabled, if_not_exists: true
  end
end
