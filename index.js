var app = require('app')
var Menu = require('menu')
var Tray = require('tray')
var async = require('async')

var CoinbaseExchange = require('coinbase-exchange')

// Report crashes to our server.
// require('crash-reporter').start()
var publicClient = new CoinbaseExchange.PublicClient()

var TIMEOUT_MS = 60 * 1000
var prevTitle = ''
var tray = null

function setState (isActive, open, price) {
  tray.setImage(__dirname + (isActive ? '/IconTemplate.png' : '/IconTemplate-inactive.png'))
  tray.setContextMenu(getMenu(isActive, open, price))
}

function getMenu (isActive, open, price) {
  var items = [
    {
      label: isActive ? 'Online' : 'Offline',
      enabled: false
    }
  ]

  if (isActive) {
    var diff = (price - open).toFixed(2)
    diff = (diff >= 0) ? '+$' + diff : '-$' + diff
    items.push({
      label: '24 Hour Price: ' + diff,
      enabled: false
    })
  }

  items.push(
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: function () {
        app.quit()
      }
    }
  )

  return Menu.buildFromTemplate(items)
}

function updatePrice () {
  async.parallel({
    stats: function (cb) {
      publicClient.getProduct24HrStats(function (err, res, stats) {
        if (err) return cb(err)
        cb(null, stats)
      })
    },

    ticker: function (cb) {
      publicClient.getProductTicker(function (err, res, ticker) {
        if (err) return cb(err)
        cb(null, ticker)
      })
    }

  }, function (err, results) {
    var title = ''
    var open = 0
    var price = 0
    if (err) {
      // do nothing, keep empty title
    } else {
      open = parseFloat(results.stats.open).toFixed(2)
      price = parseFloat(results.ticker.price).toFixed(2)
      title = '$' + price
    }

    // set title after getting update
    tray.setTitle(title)
    setState(title.length, open, price)

    // immediately set title again if title length changes to ensure tray
    // width is set properly - this is probably a glitch in electron's tray module
    if (title.length !== prevTitle.length) {
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
  tray.setContextMenu(getMenu(false))
  updatePrice()
})
