class CreatePaymentAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :payment_audit_logs do |t|
      # 🔒 Audit trail for payment security
      t.bigint :user_id, null: false, index: true
      t.bigint :user_subscription_id, index: true
      t.string :action, null: false, index: true
      t.jsonb :details, default: {}, null: false # Store additional context
      t.inet :ip_address # IP address of the request
      t.text :user_agent # User agent string for device fingerprinting
      t.timestamps
    end

    add_foreign_key :payment_audit_logs, :users, on_delete: :cascade
    add_foreign_key :payment_audit_logs, :user_subscriptions, on_delete: :nullify

    # Create index for efficient queries
    add_index :payment_audit_logs, [:user_id, :created_at], name: 'index_audit_logs_user_created_at'
    add_index :payment_audit_logs, [:action, :created_at], name: 'index_audit_logs_action_created_at'
  end
end
