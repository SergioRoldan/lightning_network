import "../stylesheets/app.css";

import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'

var Web3Utils = require('web3-utils')

import factory_artifacts from '../../build/contracts/Factory.json'
import channel_artifacts from '../../build/contracts/ChannelFinal.json'

var Factory = contract(factory_artifacts);
let ChannelFinal = contract(channel_artifacts);

var baseaccount;
var account1;

window.signMessage = function () {
  try {
    $("#message").val('');

    Factory.deployed().then(function (contractInstance) {
      return contractInstance.createChannel(account1, 1, { gas: 3000000, from: baseaccount, value: 1000000000000000000 })
    }).then(function (result) {
      $("#log").append("<p>Transaction create send succesfully</p>")
    }).catch(function (exception) {
      $("#log").append("<p>Error " + exception + ", on channel creation</p>")
    })
  } catch (e) {
    console.log(e);
    $("#log").append("<p>Error during call execution: " + e + "</p>")
  }
}

function generateUpdateState(sender, receiver, amount, id, chann, conditional) {
  let ret;

  if (conditional) {

    let hs = [];
    let rsSigned = ['0xc1abcd0000000000000000000290000000000000000000000049000000072000'];
    
    let ttls = [1626470111];
    let rhvals = [Web3Utils.toWei('0.0001', 'ether')];
    let end = [1]

    let rs = ['0xc100000000000000000000000290000000000000ab0000000049000000072000'];
    ttls.push(1626470111);
    rhvals.push(Web3Utils.toWei('0.0001', 'ether'));
    end.push(1);

    for(let i=0; i<248; i++) {
      rs.push('0x0000000000000000000000000004500000000000000000000000000000000000');
      ttls.push(1626470111);
      rhvals.push(Web3Utils.toWei('0.0001', 'ether'));
      end.push(0);
    }

    for (let i = 0; i < rsSigned.length; i++) {
      hs.push(Web3Utils.soliditySha3(
        { t: 'bytes32', v: rsSigned[i] }
      ))
    }

    for (let i = 0; i < rs.length; i++) {
      hs.push(Web3Utils.soliditySha3(
        { t: 'bytes32', v: rs[i] }
      ))
    }

    console.log("pre");

    let hsh = Web3Utils.soliditySha3(
      { t: 'uint256', v: [amount, id] },
      { t: 'address', v: [sender, chann] }, 
      { t: 'bytes32', v: rsSigned },
      { t: 'bytes32', v: hs },
      { t: 'uint256', v: ttls },
      { t: 'uint256', v: rhvals },
      { t: 'uint256', v: end}
    );

    console.log("post");

    let signature = web3.eth.sign(sender, hsh)
    signature = signature.substr(2);
    let r = '0x' + signature.slice(0, 64)
    let s = '0x' + signature.slice(64, 128)
    let v = '0x' + signature.slice(128, 130)
    let v_dec = web3.toDecimal(v) + 27

    ret = {
      'r_s': [r, s],
      'v': v_dec,
      'uploader': receiver,
      'values_id': [amount, id],
      'end_chann': [sender, chann],
      'rs': rs,
      'hs': hs,
      'ttls': ttls,
      'rhvals': rhvals,
      'end': end,
      'rsSigned': rsSigned,
      'hash': hsh,
      'signature': signature
    }
  } else {
    let hsh = Web3Utils.soliditySha3(
      { t: 'uint256', v: [amount, id] },
      { t: 'address', v: [sender, chann] }
    );

    let signature = web3.eth.sign(sender, hsh)
    signature = signature.substr(2);
    let r = '0x' + signature.slice(0, 64)
    let s = '0x' + signature.slice(64, 128)
    let v = '0x' + signature.slice(128, 130)
    let v_dec = web3.toDecimal(v) + 27

    ret = {
      'r_s': [r, s],
      'v': v_dec,
      'uploader': receiver,
      'values_id': [amount, id],
      'end_chann': [sender, chann],
      'hash': hsh,
      'signature': signature
    }
  }

  return ret;
};

$(document).ready(function () {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like Metamask")
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:7545");
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
  }

  baseaccount = web3.eth.accounts[0];
  account1 = web3.eth.accounts[1];

  console.log(baseaccount);
  console.log(account1);

  Factory.setProvider(web3.currentProvider);
  ChannelFinal.setProvider(web3.currentProvider);

  console.log("Ready");

  Factory.deployed().then(function (contractInstance) {

    contractInstance.channelProcessed().watch(function (error, results) {
      console.log('Event');
      
      if (!error) {
        $("#log").append("<p>-  EventFactory: " + results.args.ContractAddrs + "</p>");
        $("#log").append("<p>-  EventFactory: " + results.args.NearEnd + "</p>");
        $("#log").append("<p>-  EventFactory: " + results.args.FarEnd + "</p>");
        $("#log").append("<p>-  EventFactory: " + results.args.channelVal + "</p>");
        $("#log").append("<p>-  EventFactory: " + results.args.endDate + "</p>");

        let tmp = ChannelFinal.at(results.args.ContractAddrs);
        let contractAddress = results.args.ContractAddrs;

        tmp.acceptChannel({ gas: 3000000, from: account1, value: 1000000000000000000}).then(function (result) {
          $("#log").append("<p>Transaction accept send succesfully</p>")

          tmp.channelAccepted().watch(function (error, results) {

            if (!error) {
              $("#log").append("<p>-  EventAccept: " + results.args.farEndValue + "</p>");
              $("#log").append("<p>-  EventAccept: " + results.args.totalValue + "</p>");

              let updateParams = generateUpdateState(baseaccount, account1, Web3Utils.toWei('0.5', 'ether'), 4, contractAddress, true);
              console.log(updateParams);

              tmp.updateState(updateParams.end_chann, updateParams.values_id, updateParams.v, updateParams.r_s, updateParams.rsSigned, updateParams.rs, updateParams.hs, updateParams.ttls, updateParams.rhvals, updateParams.end, { gas: 3000000, from: updateParams.uploader }).then(function (result) {
                $("#log").append("<p>Transaction update send succesfully</p>")

                tmp.stateUpdated().watch(function (error, results) {
                  if (!error) {
                    $("#log").append("<p>-  EventUpdate: " + results.args.NearEnd + "</p>");
                    $("#log").append("<p>-  EventUpdate: " + results.args.nearEndValue + "</p>");
                    $("#log").append("<p>-  EventUpdate: " + results.args.FarEnd + "</p>");
                    $("#log").append("<p>-  EventUpdate: " + results.args.farEndValue + "</p>");
                    $("#log").append("<p>-  EventUpdate: " + results.args.currentId + "</p>");
                  } else {
                    $("#log").append("<p>-  EventUpdateError: " + error + "</p>");
                  }
                });

                tmp.rShownAndUsed().watch(function (error, results) {
                  if (!error) {
                    $("#log").append("<p>-  EventShow: " + results.args.random + "</p>");
                    let h = Web3Utils.soliditySha3(
                      { t: 'bytes32', v: results.args.random }
                    );
                    if(updateParams.hs.indexOf(h) !== -1) {
                      $("#log").append("<p>-  EventShow: " + updateParams.hs[updateParams.hs.indexOf(h)] + "</p>");
                    }
                  } else {
                    $("#log").append("<p>-  EventShowError: " + error + "</p>");
                  }
                });

                tmp.closeChannel(true, { gas: 3000000, from: baseaccount}).then(function (result) {
                  console.log(result);
                  $("#log").append("<p>Transaction request send succesfully</p>")

                  tmp.closeRequest().watch(function (error, results) {
                    if (!error) {
                      $("#log").append("<p>-  EventReq: " + results.args.end + "</p>");
                      $("#log").append("<p>-  EventReq: " + results.args.closeChange + "</p>");

                      $("#log").append("<p>+++" + web3.eth.getBalance(baseaccount) + "</p>")
                      $("#log").append("<p>+++" + web3.eth.getBalance(account1) + "</p>")

                      tmp.closeChannel(true, { gas: 3000000, from: account1 }).then(function (result) {
                        $("#log").append("<p>Transaction close send succesfully</p>")

                        tmp.channelClosed().watch(function (error, results) {
                          if (!error) {
                            $("#log").append("<p>-  EventClose: " + results.args.NearEnd + "</p>");
                            $("#log").append("<p>-  EventClose: " + results.args.nearEndFinalValue + "</p>");
                            $("#log").append("<p>-  EventClose: " + results.args.FarEnd + "</p>");
                            $("#log").append("<p>-  EventClose: " + results.args.farEndFinalValue + "</p>");
                            $("#log").append("<p>-  EventClose: " + results.args.finalId + "</p>");

                            $("#log").append("<p>---" + web3.eth.getBalance(baseaccount) + "</p>")
                            $("#log").append("<p>---" + web3.eth.getBalance(account1) + "</p>")
                          } else {
                            $("#log").append("<p>-  EventCloseError: " + error + "</p>");
                          }
                        })
                      }).catch(function (exception) {
                        $("#log").append("<p>Error " + exception + ", on close</p>")
                      })

                    } else {
                      $("#log").append("<p>-  EventReqError: " + error + "</p>");
                    }
                  })                  
                }).catch(function (exception) {
                  $("#log").append("<p>Error " + exception + ", on req</p>")
                })
                
              }).catch(function (exception) {
                $("#log").append("<p>Error " + exception + ", on update</p>")
              });

            } else {
              $("#log").append("<p>-  EventAcceptError: " + error + "</p>");
            }
          });

        }).catch(function (exception) {
          $("#log").append("<p>Error " + exception + ", on channel creation</p>")
        })

      } else {
        $("#log").append("<p>-  EventFactory: " + error + "</p>");
      }
    });
  }).catch(function (error) {
    $("#log").append("<p>-  Exception: " + error + "</p>");
  });

});
