var Web3 = require('web3');
var blockTimes = [];
var currentBlockHeight = 0;
var isUpdatingDisplay = false;

var db = new PouchDB('ethereum_blockwatch');

window.addEventListener('load', function() {
  var w;
  if (typeof window.web3 !== "undefined") {
    w = new Web3(window.web3.currentProvider);
  } else {
    w = new Web3();
    w.setProvider(new web3.providers.HttpProvider('https://mainnet.infura.io/qF5mTfKyGqOX2uo9SA87 '));
  }

  startApp(w);
});

/**
 * Perform a JSON-RPC call, and return a promise.
 */
function rpcGet(options, web3) {
  if (typeof options.jsonrpc == 'undefined') options.jsonrpc = '2.0';
  if (typeof options.id == 'undefined') options.id = parseInt(Math.random()*1000);
  var def = new $.Deferred();
  web3.currentProvider.sendAsync(options, function(err, rs) {
    if (err) {
      def.reject(err);
      return;
    }
    def.resolve(rs.result);
  });
  return def.promise();
}

/**
 * Get the latest block height number.
 */
function getLatestBlock(web3) {
  var latestBlock = {
    method: 'eth_blockNumber',
    params: []
  };
  return rpcGet(latestBlock, web3);
}

function getBlockData(web3, blockHeight) {
  var def = new $.Deferred();
  web3.eth.getBlock(blockHeight, false, function(err, rs) {
    if (err) {
      def.reject(err);
      return;
    }
    def.resolve(rs);
  });
  return def.promise();
}

function getLastBlocks(web3, blockHeight, num) {
  var data = [];
  var def = new $.Deferred();
  var curHeight = blockHeight;
  function doFetch() {
    getBlockData(web3, curHeight).then(function(rs) {
      data.push(rs);
      if (data.length < num) {
        curHeight--;
        doFetch();
      } else {
        def.resolve(data);
      }
    }, function(err) {
      def.reject(err);
    });
  }
  doFetch();
  return def.promise();
}

function parseAverageBlocktime() {
  var sum = 0;
  for (var i = 0; i < blockTimes.length-1; i++) {
    var delta = blockTimes[i].timestamp - blockTimes[i+1].timestamp;
    sum += delta;
  }
  return sum/blockTimes.length;
}

function showExistingAlarms() {
  if (isUpdatingDisplay) return;
  isUpdatingDisplay = true;
  var $container = $('#existing-alarms').empty();
  db.allDocs({
    include_docs: true
  }).then(function(rs) {
    rs.rows.map(function(data) {
      var doc = data.doc;
      var delta = doc.block - currentBlockHeight;

      var classes = [];
      if (delta > 0) {
        classes.push('pending');
      } else {
        classes.push('past');
      }
      var $row = $('<div id="' + doc._id  + '" class="' + classes.join(' ') + '"></div>');
      $row.append('<div class="block">' + doc.block + '</div>');

      if (delta > 0) {
        // Alarm hasn't gone off yet.
        $row.append('<div class="delta">' + delta + ' blocks to go.</div>');
      } else {
        // Alarm already happened
        $row.append('<div class="delta">' + delta*-1 + ' blocks ago.</div>');
      }
      var $delete = $('<button class="delete">X</button>');
      $delete.on('click', function(e) {

      });

      $row.append($delete);

      $container.append($row);
    });
    isUpdatingDisplay = false;
  });
}


function startApp(web3) {

  // Start timer for checking block heights
  function doBlockCheck() {
    getLatestBlock(web3).then(function(rs) {
      currentBlockHeight = web3.toBigNumber(rs).toNumber();
      $('#block-number').html(currentBlockHeight);
      getLastBlocks(web3, currentBlockHeight, 10).then(function(rs) {
        blockTimes = rs;
        var avgTime = parseAverageBlocktime();
        $('#block-time').html(avgTime + ' seconds/block');
      });
      document.title = currentBlockHeight + ' - Ethereum Blockwatch';
      console.log(currentBlockHeight);
      showExistingAlarms();
      setTimeout(doBlockCheck, 30*1000);
    }, function(err) {
      console.log(err);
    });
  }
  doBlockCheck();

  $('#new-alarm-btn').on('click', function(e) {
    var blockHeight = parseInt($('#new-alarm-num').val());
    if (isNaN(blockHeight) || blockHeight <= 0) {
      alert('Not a valid block height');
      return;
    }
    if (blockHeight < currentBlockHeight) {
      alert('Alarm occurs in the past!');
    }

    db.put({
      _id:'alarm-'+blockHeight,
      block: blockHeight
    }, function(err, rs) {
      if (err) {
        if (err.status == 409) {
          alert('Alarm already exists');
          return;
        }
        alert(err);
        return;
      }
      showExistingAlarms();
    });

    console.log(blockHeight);
  });
  showExistingAlarms();

}
