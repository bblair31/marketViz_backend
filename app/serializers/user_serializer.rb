class UserSerializer < ActiveModel::Serializer
  attributes :username, :email
  has_many :transactions
  has_many :stocks, through: :transactions
  has_many :searches
end
