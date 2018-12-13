class UserSerializer < ActiveModel::Serializer
  attributes :username, :email, :stocks
  has_many :stocks, through: :transactions
  has_many :searches
end
