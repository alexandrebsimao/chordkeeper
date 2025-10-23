class Library < ApplicationRecord
  has_many :songs, dependent: :destroy
  has_many :library_users, dependent: :destroy
  has_many :users, through: :library_users
  has_many :setlists, dependent: :destroy
  belongs_to :owner, class_name: "User"

  validates :name, presence: true
end
