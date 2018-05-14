pragma solidity ^0.4.23;

import "./ChannelExtensionV2.sol";
import "./Ownable.sol";

contract Factory is Ownable{
    
    address[] public channels;
    
    event channelProcessed(address indexed ContractAddrs, address indexed NearEnd, address indexed FarEnd,
    uint256[2] value, uint256 id, uint256 endDate);
    
    constructor () public Ownable() {}
    
    function createChannel(address _farEnd, uint _daysOpen) public payable {
        Channel channel = (new Channel).value(msg.value)(msg.sender, _farEnd, _daysOpen);
        channels.push(channel);
        emit channelProcessed(channel, msg.sender, _farEnd, channel.getStateValues(), channel.getStateId(), channel.channelEnd());
    }
    
    function suicideContract() public onlyOwner() {
        selfdestruct(owner);
    }
}