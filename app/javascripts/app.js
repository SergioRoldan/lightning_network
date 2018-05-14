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
    let _end_chan = msg[1];
    let has = msg[2];
    let _hs = msg[3];
    let _ttls = msg[4];
    let _rhValues = msg[5];

    $("#log").append("<p>Val Id:" + _values_id + "</p>");
    $("#log").append("<p>Has:" + has + "</p>");
    $("#log").append("<p>End Chann:" + _end_chan + "</p>");
    $("#log").append("<p>Hs:" + _hs + "</p>");
    $("#log").append("<p>TTLs:" + _ttls + "</p>");
    $("#log").append("<p>RHVals:" + _rhValues + "</p>");

    let tmp = Web3Utils.soliditySha3(
      { t: 'uint256', v: [_values_id.split(',')[0], _values_id.split(',')[1]] },
      { t: 'address', v: [_end_chan.split(',')[0], _end_chan.split(',')[1]] },
      { t: 'bytes32', v: _hs.split(',') },
      { t: 'uint256', v: _ttls.split(',') },
      { t: 'int256', v: _rhValues.split(',') }
    );
    
    $("#log").append("<p>Hash:" + tmp + "</p>");

    Test.deployed().then(function (contractInstance) {
      contractInstance.testing1(_values_id.split(','), _end_chan.split(','), has, _hs.split(','), _ttls.split(','), _rhValues.split(','), { gas: 500000, from: web3.eth.accounts[0] }).then(function () {
        $("#log").append("<p>Transaction send succesfully</p>")
      })
    });
    /*
    let tmp = Web3Utils.soliditySha3({ t: 'bytes32', v: '0x' + toHex(msg[0]) }, { t: 'bytes32', v: '0x' + toHex(msg[1]) }, { t: 'bytes32', v: '0x' + toHex(msg[2]) })

    let signature = web3.eth.sign(web3.eth.accounts[0], tmp);
    $("#log").append("<p>Signed message:" + signature + "</p>");

    signature = signature.substr(2);
    const r = '0x' + signature.slice(0, 64)
    const s = '0x' + signature.slice(64, 128)
    const v = '0x' + signature.slice(128, 130)
    const v_dec = web3.toDecimal(v) + 27
    $("#log").append("<p>R:" + r + "</p>")
    $("#log").append("<p>S:" + s + "</p>")
    $("#log").append("<p>V:" + v_dec + "</p>")

    let fixed_msg = `\x19Ethereum Signed Message:\n96`
    let fixed_msg_array = [msg[0], msg[1], msg[2]]
    
    $("#log").append("<p>Not Sha3:" + fixed_msg + msg_join + "</p>")
    $("#log").append("<p>Array:" + fixed_msg_array + "</p>")

    $("#log").append("<p>Solidity Hash:" + tmp + "</p>")

    Test.deployed().then(function (contractInstance) {
      contractInstance.verifySignAddr(v_dec, [r, s], fixed_msg_array, { gas: 500000, from: web3.eth.accounts[0] }).then(function () {
        $("#log").append("<p>Transaction send succesfully</p>")
      })
    });
    */
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
        $("#log").append("<p>EventStr: " + result.args.hash + "</p>");
        $("#log").append("<p>EventStr: " + result.args.expected + "</p>");
        $("#log").append("<p>EventStr: " + result.args.compare + "</p>");
      }
    });
  }).catch(function (error) {
    console.log("<p>Error: " + error + "</p>");
  });
  Test.deployed().then(function (contractInstance) {
    contractInstance.kec().watch(function (error, result) {
      if (!error)
        $("#log").append("<p>EventHash: " + result.args.kec + "</p>");
    });
  }).catch(function (error) {
    console.log("<p>Error: " + error + "</p>");
  });

});

/*
1,1//0xca35b7d915458ef540ade6068dfe2f44e8fa733c,0xca35b7d915458ef540ade6068dfe2f44e8fa733c//0xc997bbdbb92ab1280294e553ec3324dbf3a4ec8083940bf1b3aa34a4bd406a95//0x0100000000000000000000000000000000000000000000000000000000000000,0x0100000000000000000000000000000000000000000000000000000000000000//3,3//4,4

0xca35b7d915458ef540ade6068dfe2f44e8fa733c
*/