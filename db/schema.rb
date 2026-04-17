# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_17_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "feature_flags", force: :cascade do |t|
    t.text "allowed_plans"
    t.text "config"
    t.datetime "created_at", null: false
    t.text "description"
    t.boolean "enabled", default: false, null: false
    t.string "key", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["enabled"], name: "index_feature_flags_on_enabled"
    t.index ["key"], name: "index_feature_flags_on_key", unique: true
  end

  create_table "features", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.string "label", null: false
    t.integer "sort_order", default: 0
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_features_on_key", unique: true
  end

  create_table "jwt_denylists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "exp"
    t.string "jti"
    t.datetime "updated_at", null: false
    t.index ["jti"], name: "index_jwt_denylists_on_jti", unique: true
  end

  create_table "libraries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name"
    t.bigint "owner_id", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_id"], name: "index_libraries_on_owner_id"
  end

  create_table "library_users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_current_scope", default: false, null: false
    t.bigint "library_id", null: false
    t.string "role", default: "admin", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["library_id"], name: "index_library_users_on_library_id"
    t.index ["user_id", "is_current_scope"], name: "index_library_users_on_user_id_and_is_current_scope", unique: true, where: "(is_current_scope = true)"
    t.index ["user_id"], name: "index_library_users_on_user_id"
  end

  create_table "media_references", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description"
    t.string "media_type"
    t.bigint "song_id", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.index ["song_id"], name: "index_media_references_on_song_id"
  end

  create_table "plan_features", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "feature_id", null: false
    t.bigint "plan_id", null: false
    t.datetime "updated_at", null: false
    t.index ["feature_id"], name: "index_plan_features_on_feature_id"
    t.index ["plan_id", "feature_id"], name: "index_plan_features_on_plan_id_and_feature_id", unique: true
    t.index ["plan_id"], name: "index_plan_features_on_plan_id"
  end

  create_table "plans", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "duration_days", default: 30, null: false
    t.text "features"
    t.string "interval", default: "month", null: false
    t.integer "max_collaborators", default: 1
    t.integer "max_setlists"
    t.integer "max_songs"
    t.string "name", null: false
    t.integer "price_cents", default: 0, null: false
    t.integer "sort_order", default: 0
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_plans_on_active"
    t.index ["name"], name: "index_plans_on_name", unique: true
  end

  create_table "public_setlists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "setlist_id", null: false
    t.datetime "updated_at", null: false
    t.string "uuid"
    t.index ["setlist_id"], name: "index_public_setlists_on_setlist_id"
  end

  create_table "setlist_songs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "position"
    t.bigint "setlist_id", null: false
    t.bigint "song_id", null: false
    t.datetime "updated_at", null: false
    t.index ["setlist_id"], name: "index_setlist_songs_on_setlist_id"
    t.index ["song_id"], name: "index_setlist_songs_on_song_id"
  end

  create_table "setlist_users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "role", default: "read_only", null: false
    t.bigint "setlist_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["setlist_id"], name: "index_setlist_users_on_setlist_id"
    t.index ["user_id", "setlist_id"], name: "index_setlist_users_on_user_id_and_setlist_id", unique: true
    t.index ["user_id"], name: "index_setlist_users_on_user_id"
  end

  create_table "setlists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "library_id", null: false
    t.bigint "owner_id", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["library_id"], name: "index_setlists_on_library_id"
    t.index ["owner_id"], name: "index_setlists_on_owner_id"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "song_pdf_caches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "font_size", null: false
    t.text "pdf_data", null: false
    t.bigint "song_id", null: false
    t.datetime "updated_at", null: false
    t.index ["song_id", "font_size"], name: "index_song_pdf_caches_on_song_id_and_font_size", unique: true
    t.index ["song_id"], name: "index_song_pdf_caches_on_song_id"
  end

  create_table "songs", force: :cascade do |t|
    t.string "artist"
    t.integer "bpm"
    t.integer "capo"
    t.text "content"
    t.boolean "convert_pdf", default: false, null: false
    t.datetime "created_at", null: false
    t.string "genre"
    t.bigint "library_id", null: false
    t.jsonb "lyrics"
    t.string "original_key"
    t.string "title"
    t.string "transpose_key"
    t.datetime "updated_at", null: false
    t.index ["library_id"], name: "index_songs_on_library_id"
  end

  create_table "subscription_notifications", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "kind", null: false
    t.text "message", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "read_at"
    t.datetime "scheduled_for"
    t.datetime "sent_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "user_subscription_id", null: false
    t.index ["kind", "scheduled_for"], name: "index_subscription_notifications_on_kind_and_scheduled_for"
    t.index ["user_id", "read_at"], name: "index_subscription_notifications_on_user_id_and_read_at"
    t.index ["user_id"], name: "index_subscription_notifications_on_user_id"
    t.index ["user_subscription_id"], name: "index_subscription_notifications_on_user_subscription_id"
  end

  create_table "user_subscriptions", force: :cascade do |t|
    t.boolean "auto_renew", default: true, null: false
    t.datetime "cancelled_at"
    t.datetime "created_at", null: false
    t.string "customer_document"
    t.string "customer_name"
    t.string "customer_phone"
    t.datetime "downgraded_at"
    t.datetime "expires_at"
    t.string "external_subscription_id"
    t.datetime "last_renewed_at"
    t.string "payment_method_brand"
    t.string "payment_method_last4"
    t.string "payment_method_token"
    t.string "payment_provider"
    t.bigint "plan_id", null: false
    t.bigint "previous_plan_id"
    t.string "provider_customer_id"
    t.integer "renewal_attempts", default: 0
    t.datetime "renewal_failed_at"
    t.datetime "renewal_tolerance_ends_at"
    t.datetime "started_at"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["auto_renew"], name: "index_user_subscriptions_on_auto_renew"
    t.index ["expires_at"], name: "index_user_subscriptions_on_expires_at"
    t.index ["external_subscription_id"], name: "index_user_subscriptions_on_external_subscription_id"
    t.index ["plan_id"], name: "index_user_subscriptions_on_plan_id"
    t.index ["renewal_failed_at"], name: "index_user_subscriptions_on_renewal_failed_at"
    t.index ["renewal_tolerance_ends_at"], name: "index_user_subscriptions_on_renewal_tolerance_ends_at"
    t.index ["status"], name: "index_user_subscriptions_on_status"
    t.index ["user_id", "status"], name: "index_user_subscriptions_on_user_id_and_status"
    t.index ["user_id"], name: "index_user_subscriptions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "confirmation_sent_at"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name"
    t.string "provider"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "user", null: false
    t.string "uid"
    t.string "unconfirmed_email"
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "libraries", "users", column: "owner_id"
  add_foreign_key "library_users", "libraries"
  add_foreign_key "library_users", "users"
  add_foreign_key "media_references", "songs"
  add_foreign_key "plan_features", "features"
  add_foreign_key "plan_features", "plans"
  add_foreign_key "public_setlists", "setlists"
  add_foreign_key "setlist_songs", "setlists"
  add_foreign_key "setlist_songs", "songs"
  add_foreign_key "setlist_users", "setlists"
  add_foreign_key "setlist_users", "users"
  add_foreign_key "setlists", "libraries"
  add_foreign_key "setlists", "users", column: "owner_id"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "song_pdf_caches", "songs"
  add_foreign_key "songs", "libraries"
  add_foreign_key "subscription_notifications", "user_subscriptions"
  add_foreign_key "subscription_notifications", "users"
  add_foreign_key "user_subscriptions", "plans"
  add_foreign_key "user_subscriptions", "users"
end
