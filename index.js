var app = require('app')
var Menu = require('menu')
var Tray = require('tray')

var CoinbaseExchange = require('coinbase-exchange')

// Report crashes to our server.
// require('crash-reporter').start()
var publicClient = new CoinbaseExchange.PublicClient()

var TIMEOUT_MS = 60 * 1000
var firstUpdate = true
var tray = null

function updatePrice () {
  publicClient.getProductTicker(function (err, ticker) {
    if (err) {
      // TODO eventually do something when this fails
    } else {
      // TODO catch error from JSON.parse()
      var json = JSON.parse(ticker.body)
      var price = parseFloat(json.price).toFixed(2)
      tray.setTitle('$' + price)
    }

    if (firstUpdate) {
      // immediately set price again on first update to ensure tray width is
      // set properly - this is probably a glitch in electron's tray module
      firstUpdate = false
      process.nextTick(function () {
        tray.setTitle('$' + price)
      })
    }

    setTimeout(updatePrice, TIMEOUT_MS)
  })
}

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function () {
  // hide dock icon (OSX only)
  app.dock && app.dock.hide && app.dock.hide()
  
  tray = new Tray(__dirname + '/IconTemplate.png')
  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quit',
      click: function () {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
  updatePrice()
})
