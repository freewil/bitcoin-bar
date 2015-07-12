var app = require('app')
var Menu = require('menu')
var Tray = require('tray')

var CoinbaseExchange = require('coinbase-exchange')

// Report crashes to our server.
// require('crash-reporter').start()
var publicClient = new CoinbaseExchange.PublicClient()

var TIMEOUT_MS = 60 * 1000
var prevTitle = ''
var tray = null

function setState (isActive) {
  tray.setImage(__dirname + (isActive ? '/IconTemplate.png' : '/IconTemplate-inactive.png'))
}

function updatePrice () {
  publicClient.getProductTicker(function (err, ticker) {
    var title = ''

    if (err) {
      // do nothing, keep empty title
    } else {
      try {
        var json = JSON.parse(ticker.body)
        title = '$' + parseFloat(json.price).toFixed(2)
      } catch (e) {
        // do nothing, keep empty title
      }
    }

    // set title after getting update
    tray.setTitle(title)
    setState(title.length ? true : false)

    if (title.length != prevTitle.length) {
      // immediately set title again if title length changes to ensure tray
      // width is set properly - this is probably a glitch in electron's tray module
      process.nextTick(function () {
        tray.setTitle(title)
      })
    }

    prevTitle = title
    setTimeout(updatePrice, TIMEOUT_MS)
  })
}

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function () {
  // hide dock icon (OSX only)
  app.dock && app.dock.hide && app.dock.hide()

  tray = new Tray(__dirname + '/IconTemplate-inactive.png')
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
