var Web3 = require('web3');
var blockTimes = [];

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

function getLastFiveBlocks(web3, blockHeight) {
  var data = [];
  var def = new $.Deferred();
  var curHeight = blockHeight;
  function doFetch() {
    getBlockData(web3, curHeight).then(function(rs) {
      data.push(rs);
      if (data.length < 5) {
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


function startApp(web3) {

  // Start timer for checking block heights
  function doBlockCheck() {
    getLatestBlock(web3).then(function(rs) {
      var blockNum = web3.toBigNumber(rs).toNumber();
      $('#block-number').html(blockNum);
      getLastFiveBlocks(web3, blockNum).then(function(rs) {
        blockTimes = rs;
        var avgTime = parseAverageBlocktime();
        $('#block-time').html(avgTime + ' seconds/block');
      });
      document.title = blockNum + ' - Ethereum Blockwatch';
      console.log(blockNum);
      setTimeout(doBlockCheck, 30*1000);
    }, function(err) {
      console.log(err);
    });
  }
  doBlockCheck();

}
