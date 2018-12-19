class Stock < ApplicationRecord
  has_many :transactions
  has_many :users, through: :transactions
  validates :symbol, uniqueness: { case_sensitive: false }
end ### End of Stock Class
