var debug = require('debug')('oa-feathers')
var feathers = require('feathers');
var bodyParser = require('body-parser');
var cors = require('cors');

var Feather = require('oa-feather');

function Feathers (stores) {
  debug(stores);

  var app = feathers()
  .use(cors({ origin: true, credentials: true }))
  .options('*', cors())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(
    feathers.rest(Feather.handler)
  )
  ;
  
  // setup store services
  stores.forEach(function (store, name) {
    service = new Feather(store)
    debug("app.use(", name.toLowerCase(), service, ")");
    app.use(name.toLowerCase(), service);
  });
  
  return app
  .configure(feathers.errors())
  .setup()
  ;
}

module.exports = Feathers;
