class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  # Associations
  has_many :library_users, dependent: :destroy
  has_many :libraries, through: :library_users
  has_many :user_subscriptions, dependent: :destroy
  has_one :active_subscription, -> { active }, class_name: 'UserSubscription'
  has_one :current_plan, through: :active_subscription, source: :plan

  # Validations
  validates :role, inclusion: { in: %w[user admin] }

  # Scopes
  scope :admins, -> { where(role: 'admin') }
  scope :regular_users, -> { where(role: 'user') }

  # Methods
  def admin?
    role == 'admin'
  end

  def has_active_subscription?
    active_subscription.present?
  end

  def plan_name
    current_plan&.name || 'Free'
  end

  def can_create_song?
    return true unless current_plan&.max_songs
    libraries.sum { |lib| lib.songs.count } < current_plan.max_songs
  end

  def can_create_setlist?
    return true unless current_plan&.max_setlists
    libraries.sum { |lib| lib.setlists.count } < current_plan.max_setlists
  end

  def has_feature?(feature_key)
    return true if admin?
    
    # Check feature flag
    feature = FeatureFlag.find_by(key: feature_key, enabled: true)
    return false unless feature
    
    feature.available_for_user?(self)
  end

  def songs_count
    libraries.sum { |lib| lib.songs.count }
  end

  def setlists_count
    libraries.sum { |lib| lib.setlists.count }
  end

  def songs_limit
    current_plan&.max_songs || Float::INFINITY
  end

  def setlists_limit
    current_plan&.max_setlists || Float::INFINITY
  end
end
