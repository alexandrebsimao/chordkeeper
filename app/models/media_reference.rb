class MediaReference < ApplicationRecord
  belongs_to :song

  attr_accessor :reference_type

  has_one_attached :attachment
end
