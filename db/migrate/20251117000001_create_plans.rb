class CreatePlans < ActiveRecord::Migration[8.0]
  def change
    create_table :plans do |t|
      t.string :name, null: false
      t.integer :price_cents, default: 0, null: false
      t.string :interval, default: 'month', null: false # 'month' or 'year'
      t.integer :max_songs
      t.integer :max_setlists
      t.integer :max_collaborators, default: 1
      t.text :features # JSON serialized features
      t.boolean :active, default: true, null: false
      t.integer :sort_order, default: 0

      t.timestamps
    end

    add_index :plans, :name, unique: true
    add_index :plans, :active
  end
end
