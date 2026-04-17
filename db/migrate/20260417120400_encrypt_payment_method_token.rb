class EncryptPaymentMethodToken < ActiveRecord::Migration[8.1]
  def up
    # Add encrypted columns for attr_encrypted
    add_column :user_subscriptions, :encrypted_payment_method_token, :text unless column_exists?(:user_subscriptions, :encrypted_payment_method_token)
    add_column :user_subscriptions, :encrypted_payment_method_token_iv, :text unless column_exists?(:user_subscriptions, :encrypted_payment_method_token_iv)

    # Migrate data from old column to encrypted column (if data exists)
    UserSubscription.reset_column_information
    
    # This will use attr_encrypted to automatically encrypt when assigning
    if column_exists?(:user_subscriptions, :payment_method_token)
      UserSubscription.find_each do |subscription|
        if subscription.payment_method_token.present?
          # attr_encrypted will handle encryption on assignment
          subscription.payment_method_token = subscription.read_attribute(:payment_method_token)
          subscription.save!
        end
      end
    end

    # Remove old unencrypted column after data migration
    remove_column :user_subscriptions, :payment_method_token if column_exists?(:user_subscriptions, :payment_method_token)
  end

  def down
    # Restore old column structure for rollback
    add_column :user_subscriptions, :payment_method_token, :text unless column_exists?(:user_subscriptions, :payment_method_token)
    
    UserSubscription.reset_column_information
    
    # Decrypt data back to old column
    UserSubscription.find_each do |subscription|
      if subscription.encrypted_payment_method_token.present?
        subscription.write_attribute(:payment_method_token, subscription.payment_method_token)
        subscription.save!(validate: false)
      end
    end

    # Remove encrypted columns
    remove_column :user_subscriptions, :encrypted_payment_method_token if column_exists?(:user_subscriptions, :encrypted_payment_method_token)
    remove_column :user_subscriptions, :encrypted_payment_method_token_iv if column_exists?(:user_subscriptions, :encrypted_payment_method_token_iv)
  end
end
