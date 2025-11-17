class CreateFeatureFlags < ActiveRecord::Migration[8.0]
  def change
    create_table :feature_flags do |t|
      t.string :key, null: false
      t.string :name, null: false
      t.text :description
      t.boolean :enabled, default: false, null: false
      t.text :allowed_plans # JSON array of plan names
      t.text :config # JSON config for the feature

      t.timestamps
    end

    add_index :feature_flags, :key, unique: true
    add_index :feature_flags, :enabled
  end
end
