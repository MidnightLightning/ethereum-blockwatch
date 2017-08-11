var Web3 = require('web3');

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


function startApp(web3) {

  // Start timer for checking block heights
  function doBlockCheck() {
    getLatestBlock(web3).then(function(rs) {
      var blockNum = web3.toBigNumber(rs).toNumber();
      $('#block-number').html(blockNum);
      document.title = blockNum + ' - Ethereum Blockwatch';
      console.log(blockNum);
      setTimeout(doBlockCheck, 30*1000);
    }, function(err) {
      console.log(err);
    });
  }
  doBlockCheck();

}
