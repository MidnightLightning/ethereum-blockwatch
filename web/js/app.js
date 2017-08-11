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


function startApp(web3) {

  var latestBlock = {
    method: 'eth_blockNumber',
    params: []
  };
  rpcGet(latestBlock, web3).then(function(rs) {
    console.log(web3.toBigNumber(rs).toNumber(), rs);
  }, function(err) {
    console.error(err);
  });


  var newBlocks = {
    method: 'eth_newBlockFilter',
    params: []
  };
  function checkFilter(filterId) {
    var filterResult = {
      method: 'eth_getFilterChanges',
      params: [
        filterId
      ]
    };
    rpcGet(filterResult, web3).then(function(rs) {
      console.log(rs);
      setTimeout(function() {
        checkFilter(filterId)
      }, 30*1000);
    }, function(err) {
      console.error(err);
    });
  }

  rpcGet(newBlocks, web3).then(function(rs) {
    checkFilter(rs);
  });


  /*
  var filter = web3.eth.filter('latest');
  filter.watch(function (err, result) {
    console.log(err, result);
  });
  */
}
