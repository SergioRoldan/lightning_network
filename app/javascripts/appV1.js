import "../stylesheets/app.css";

import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

import test_artifacts from '../../build/contracts/Test.json'

var Test = contract(test_artifacts);

function toHex(str) {
  var hex = ''
  for(let i = 0; i<str.length; i++) {
    hex += ''+str.charCodeAt(i).toString(16)
  }
  return hex
}

window.signMessage = function() {
  let msg = $("#message").val();

  try {
    $("#log").append("<p>Message to sign:" + msg + "</p>");
    $("#message").val('');
    let signature = web3.eth.sign(web3.eth.accounts[0], '0x'+toHex(msg));
    $("#log").append("<p>Signed message:" + signature + "</p>");

    signature = signature.substr(2);
    const r = '0x' + signature.slice(0,64)
    const s = '0x' + signature.slice(64, 128)
    const v = '0x' + signature.slice(128,130)
    const v_dec = web3.toDecimal(v)+27
    $("#log").append("<p>R:" + r + "</p>")
    $("#log").append("<p>S:" + s + "</p>")
    $("#log").append("<p>V:" + v_dec + "</p>")
    
    let fixed_msg = `\x19Ethereum Signed Message:\n${msg.length}${msg}`
    let fixed_msg_sha = web3.sha3(fixed_msg)
    $("#log").append("<p>Not Sha3:" + fixed_msg + "</p>")
    $("#log").append("<p>Sha3:" + fixed_msg_sha + "</p>")
    Test.deployed().then(function(contractInstance) {
      contractInstance.verifySignAddr(v_dec, [r,s], fixed_msg, {gas:500000, from: web3.eth.accounts[0]}).then(function() {
        $("#log").append("<p>Transaction send succesfully</p>")
      })
    });
  } catch (err) {
    console.log(err);
    $("#log").append("<p>Error during call execution: " + err + "</p>")
  }
}

$(document).ready(function() {
  if(typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like Metamask")
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:7545");
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
  }

  Test.setProvider(web3.currentProvider);
  Test.deployed().then(function(contractInstance) {
    contractInstance.signatureStr().watch(function (error, result) {
      if (!error)
        $("#log").append("<p>EventStr: " + result.args.addr + "</p>");
    });
  }).catch(function(error) {
    console.log("<p>Error: " + error + "</p>");
  });
});