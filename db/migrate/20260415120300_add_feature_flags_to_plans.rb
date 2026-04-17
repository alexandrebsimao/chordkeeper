class AddFeatureFlagsToPlans < ActiveRecord::Migration[7.1]
  def change
    # Create features table
    create_table :features do |t|
      t.string :key, null: false
      t.string :label, null: false
      t.text :description
      t.integer :sort_order, default: 0

      t.timestamps
    end

    add_index :features, :key, unique: true

    # Create plan_features junction table
    create_table :plan_features do |t|
      t.references :plan, null: false, foreign_key: true
      t.references :feature, null: false, foreign_key: true

      t.timestamps
    end

    add_index :plan_features, [:plan_id, :feature_id], unique: true
  end
end
