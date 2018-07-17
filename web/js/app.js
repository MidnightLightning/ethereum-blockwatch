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
    w.setProvider(new Web3.providers.HttpProvider('https://mainnet.infura.io/qF5mTfKyGqOX2uo9SA87 '));
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
  if (blockTimes.length == 0) {
    return 10;
  }
  var sum = 0;
  for (var i = 0; i < blockTimes.length-1; i++) {
    var delta = blockTimes[i].timestamp - blockTimes[i+1].timestamp;
    sum += delta;
  }
  return sum/blockTimes.length;
}

function handleDeleteClicked(e) {
  var $btn = $(this);
  var $container = $btn.closest('.alarm');
  var doc = $container.data('alarm');
  db.remove(doc).then(function(doc) {
    showExistingAlarms();
  }).catch(function(err) {
    alert(err);
  });
}

function blocksToTime(blocks) {
  var blockTime = parseAverageBlocktime();
  var secs = blocks * blockTime;
  if (secs < 0) secs = secs * -1;
  var numOpts = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  if (secs > 120) {
    var min = secs/60;
    if (min > 120) {
      var hrs = min/60;
      if (hrs > 36) {
        var days = hrs/24;
        if (days > 500) {
          var yrs = days/365;
          return yrs.toLocaleString(false, numOpts) + ' years';
        } else {
          return days.toLocaleString(false, numOpts) + ' days';
        }
      } else {
        return hrs.toLocaleString(false, numOpts) + ' hours';
      }
    } else {
      return min.toLocaleString(false, numOpts) + ' minutes';
    }
  } else {
    return secs.toLocaleString(false, numOpts) + ' seconds';
  }
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

      var classes = ['alarm'];
      if (delta > 60) {
        classes.push('future');
      } else if (delta > -6) {
        classes.push('pending');
      } else {
        classes.push('past');
      }
      var $row = $('<div id="' + doc._id  + '" class="' + classes.join(' ') + '"></div>');
      $row.data('alarm', doc);

      $row.append('<div class="label">' + doc.label + '</div>');
      $row.append('<div class="block">' + doc.block + '</div>');

      var b;
      if (delta > 0) {
        // Alarm hasn't gone off yet.
        b = (delta == 1)? 'block' : 'blocks';
        $row.append('<div class="delta">' + delta.toLocaleString() + ' ' + b + ' to go.</div>');
        $row.append('<div class="time">(About ' + blocksToTime(delta) + ')</div>');
      } else {
        // Alarm already happened
        b = (delta == -1)? 'block' : 'blocks';
        $row.append('<div class="delta">' + delta*-1 + ' ' + b + ' ago.</div>');
        $row.append('<div class="time">(About ' + blocksToTime(delta) + ' ago)</div>');
      }
      var $delete = $('<img title="Delete" class="btn btn-delete" src="./icon_delete.svg" />');
      $delete.on('click', handleDeleteClicked);

      $row.append($delete.wrap('<div class="action-buttons" />').parent());

      $container.append($row);
    });
    isUpdatingDisplay = false;
  });
}


function startApp(web3) {

  // Start timer for checking block heights
  function doBlockCheck() {
    let lastHeight = currentBlockHeight;
    getLatestBlock(web3).then(function(rs) {
      currentBlockHeight = web3.toBigNumber(rs).toNumber();
      getLastBlocks(web3, currentBlockHeight, 10).then(function(rs) {
        blockTimes = rs;
        var avgTime = parseAverageBlocktime();
        $('#block-time').html(avgTime + ' seconds/block');
        showExistingAlarms();
      });

      // Update display
      $('#block-number').html(currentBlockHeight);
      document.title = currentBlockHeight + ' - Ethereum Blockwatch';
      console.log(currentBlockHeight);

      // Check if any alarms should now fire
      if (lastHeight > 0) {
        db.allDocs({
          include_docs: true
        }).then(function (rs) {
          var shouldAlarm = false;
          rs.rows.map(function (data) {
            var doc = data.doc;
            if (doc.block > lastHeight && doc.block <= currentBlockHeight) {
              shouldAlarm = true;
            }
          });
          if (shouldAlarm) {
            alert('Block height reached!');
          }
        });
      }

      // Set timeout to check again
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
      return;
    }
    var alarmLabel = $('#new-alarm-label').val();

    db.put({
      _id: 'alarm-'+blockHeight,
      block: blockHeight,
      label: alarmLabel
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

}
