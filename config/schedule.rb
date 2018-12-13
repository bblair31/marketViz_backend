every 1.day, at: '8:00 am' do
  runner "Stock.fetch_stocks"
end

every :reboot do
  runner "Stock.fetch_stocks"
end
