class User < ApplicationRecord
  has_secure_password
  has_many :transactions
  has_many :stocks, through: :transactions
  has_many :searches
  validates :username, uniqueness: { case_sensitive: false }
  validates :email, uniqueness: { case_sensitive: false }
end
