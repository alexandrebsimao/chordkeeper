class AddRenewalTrackingToUserSubscriptions < ActiveRecord::Migration[7.0]
  def change
    add_column :user_subscriptions, :renewal_failed_at, :datetime, if_not_exists: true
    add_column :user_subscriptions, :renewal_attempts, :integer, default: 0, if_not_exists: true
    add_column :user_subscriptions, :renewal_tolerance_ends_at, :datetime, if_not_exists: true
    add_column :user_subscriptions, :previous_plan_id, :bigint, if_not_exists: true
    add_column :user_subscriptions, :downgraded_at, :datetime, if_not_exists: true
    
    add_index :user_subscriptions, :renewal_failed_at, if_not_exists: true
    add_index :user_subscriptions, :renewal_tolerance_ends_at, if_not_exists: true
  end
end
