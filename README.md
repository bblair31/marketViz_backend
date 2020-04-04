
# MarketViz 📊📈

Financial research application to visualize real-time stock market and cryptocurrency data. Users can do in-depth research on all stocks listed on US Stock Exchanges and on cryptocurrencies. They can create portfolios and visualize diversification as well as basic performance metrics.

* [Working Demo](https://market-viz.herokuapp.com)

* [Demo Video](https://www.dropbox.com/s/tjf8mflvrdpd7qj/MarketViz%20Demo%20Video.mov?dl=0)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

**Once you have this backend Rails API server up and running, you will need to fork and locally clone the React frontend from this repository:** [MarketViz Frontend](https://github.com/bblair31/marketViz_frontend)

* You will need [PostgreSQL](https://www.postgresql.org/download/) running on your local environment.

### Installing

1. Fork and clone this repository

2. Install all required gems

```
bundle install
```
  * *NOTE*: If you get an error message about needing to install Bundler, from the command line run `gem install bundler`

3. Created new PostgreSQL development database

```
rails db:create
```

4. Run all database migrations and establish schema

```
rails db:migrate
```

5. Start the Rails Server

```
rails server
```
6. Check to see if browser can communicate with the database

  * Open your default browser and navigate to localhost:3000 (or whatever address is listed in the command line at 'Listening on tcp:'


__Ctrl + c will stop the server when you are done testing

## Built With

* [Ruby on Rails](https://rubyonrails.org/) - Full stack framework
* [PostgreSQL](https://www.postgresql.org/docs/) - Open source object-relational database system
* [IEX API](https://iextrading.com/developer/docs/) - API for gathering real-time stock information
* [Faker Gem](https://github.com/stympy/faker) - Factory for generating seed data
* [JWT Gem](https://github.com/jwt/ruby-jwt) - Pass/store JSON Web Tokens for auth purposes


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details


## Acknowledgments

* Data provided for free by [IEX](https://iextrading.com/developer/). View IEX’s [Terms of Use](https://iextrading.com/api-exhibit-a/).
