import "../stylesheets/app.css";

import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'

var Web3Utils = require('web3-utils')

import test_artifacts from '../../build/contracts/Test.json'

var Test = contract(test_artifacts);

function toHex(str) {
  var hex = ''
  for (let i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16)
  }
  return hex
}

function toBytes32(str) {
  var hex = str;

  for (let i = str.length; i < 64; i++) {
    hex += "0";
  }

  return hex
}

window.signMessage = function () {
  let msg = $("#message").val();
  msg = msg.split("//");

  try {
    $("#message").val('');

    let _values_id = msg[0];
    let _end_chan = [web3.eth.accounts[0], msg[1]];
    let _rs = msg[2]
    let _ttls = msg[3];
    let _rhValues = msg[4];

    let _hs = [];

    for(let i = 0; i< _rs.split(',').length; i++) {
      _hs[i] = Web3Utils.soliditySha3(
        { t: 'bytes32', v: _rs.split(',')[i] }
      )
    }

    $("#log").append("<p>Val Id:" + [_values_id.split(',')[0], _values_id.split(',')[1]] + "</p>");
    $("#log").append("<p>End Chann:" + _end_chan + "</p>");
    $("#log").append("<p>Rs:" + _rs.split(',') + "</p>");
    $("#log").append("<p>Hs:" + _hs + "</p>");
    $("#log").append("<p>TTLs:" + _ttls.split(',') + "</p>");
    $("#log").append("<p>RHVals:" + _rhValues.split(',') + "</p>");

    let hsh = Web3Utils.soliditySha3(
      { t: 'uint256', v: [_values_id.split(',')[0], _values_id.split(',')[1]] },
      { t: 'address', v: _end_chan },
      { t: 'bytes32', v: _rs.split(',') },
      { t: 'bytes32', v: _hs },
      { t: 'uint256', v: _ttls.split(',') },
      { t: 'int256', v: _rhValues.split(',') }
    );
    
    $("#log").append("<p>Hash:" + hsh + "</p>");

    /*Test.deployed().then(function (contractInstance) {
      contractInstance.testing1(_values_id.split(','), _end_chan, hsh, _hs.split(','), _ttls.split(','), _rhValues.split(','), { gas: 500000, from: web3.eth.accounts[0] }).then(function () {
        $("#log").append("<p>Transaction send succesfully</p>")
      })
    });*/

    let signature = web3.eth.sign(web3.eth.accounts[0], hsh);
    $("#log").append("<p>Signature: "+ signature +"</p>");

    signature = signature.substr(2);
    let r = '0x' + signature.slice(0,64)
    let s = '0x' + signature.slice(64,128)
    let v = '0x' + signature.slice(128, 130)
    let v_dec = web3.toDecimal(v) + 27

    $("#log").append("<p>r, s, v:" + r + ',' + s + ',' + v_dec + "</p>")

    /*Test.deployed().then(function (contractInstance) {
      return contractInstance.testing2(_values_id.split(','), _end_chan, hsh, _rs.split(','), _hs, _ttls.split(','), _rhValues.split(','), v_dec, [r, s], { gas: 6021975, from: web3.eth.accounts[0] })
    }).then(function(result) {
      $("#log").append("<p>Transaction 2 send succesfully</p>")
    }).catch(function (e) {
        $("#log").append("<p>Error 2"+e+"</p>")
    });*/

    Test.deployed().then(function (contractInstance) {
      return contractInstance.testing2a(_values_id.split(','), _end_chan, hsh, [_rs.split(',')[0]], [_rs.split(',')[1]],_hs, _ttls.split(','), _rhValues.split(','), v_dec, [r, s], { gas: 6021975, from: web3.eth.accounts[0] })
    }).then(function (result) {
      $("#log").append("<p>Transaction 2 send succesfully</p>")
    }).catch(function (e) {
      $("#log").append("<p>Error 2" + e + "</p>")
    });

  } catch (err) {
    console.log(err);
    $("#log").append("<p>Error during call execution: " + err + "</p>")
  }
}

$(document).ready(function () {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like Metamask")
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:7545");
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
  }

  Test.setProvider(web3.currentProvider);
  Test.deployed().then(function (contractInstance) {
    contractInstance.comHash().watch(function (error, result) {
      if (!error) {
        $("#log").append("<p>-  EventHash: " + result.args.hash + "</p>");
        $("#log").append("<p>-  EventHash: " + result.args.expected + "</p>");
        $("#log").append("<p>-  EventHash: " + result.args.compare + "</p>");
      }
    });
  }).catch(function (error) {
    console.log("<p>Error: " + error + "</p>");
  });
  Test.deployed().then(function (contractInstance) {
    contractInstance.signat().watch(function (error, result) {
      if (!error) {
        $("#log").append("<p>-  EventSignature: " + result.args.obtain + "</p>");
        $("#log").append("<p>-  EventSignature: " + result.args.expected + "</p>");
        $("#log").append("<p>-  EventSignature: " + result.args.compare + "</p>");
      }
        
    });
  }).catch(function (error) {
    console.log("<p>Error: " + error + "</p>");
  });
  Test.deployed().then(function (contractInstance) {
    contractInstance.rsShownAndUsed().watch(function (error, result) {
      if (!error) {
        $("#log").append("<p>-  EventLock: " + result.args.randoms + "</p>");
        $("#log").append("<p>-  EventLock: " + result.args.hashes + "</p>");
        $("#log").append("<p>-  EventLock: " + result.args.correctRs + "</p>");
      }

    });
  }).catch(function (error) {
    console.log("<p>Error: " + error + "</p>");
  });
  Test.deployed().then(function (contractInstance) {
    contractInstance.stateUpdated().watch(function (error, result) {
      if (!error) {
        $("#log").append("<p>-  EventState: " + result.args.close + "</p>");
        $("#log").append("<p>-  EventState: " + result.args.far + "</p>");
        $("#log").append("<p>-  EventState: " + result.args.id + "</p>");
      }

    });
  }).catch(function (error) {
    console.log("<p>Error: " + error + "</p>");
  });
  Test.deployed().then(function (contractInstance) {
    contractInstance.err().watch(function (error, result) {
      $("#log").append("<p>-  EventJo: " + result.args + "</p>");
    });
  }).catch(function (error) {
    console.log("<p>Error: " + error + "</p>");
  });
});

/*

1000,4//0xca35b7d915458ef540ade6068dfe2f44e8fa733c//0xc100000000000000000000000290000000000000000000000049000000072000//1626470111//32

1000,4//0xca35b7d915458ef540ade6068dfe2f44e8fa733c//0xc100000000000000000000000290000000000000000000000049000000072000,0xc100000000000000000000000290000000000000000000000049000000072000//1626470111,1626470111//32,32

1000,4//0xca35b7d915458ef540ade6068dfe2f44e8fa733c//0xc100000000000000000000000290000000000000000000000049000000072000,0xc100000000000000000000000290000000000000000000000049000000072000,0xc100000000000000000000000290000000000000000000000049000000072000//1626470111,1626470111,1626470111//32,32,32

*/