pragma solidity ^0.4.23;

contract Expirable {
    
    uint256 public channelEnd;
    
    constructor (uint256 _daysToExpire) internal {
        channelEnd = now + (_daysToExpire * 1 days);
    }
    
    modifier hasNotExpired() {
        require(now <= channelEnd);
        _;
    }
    
    modifier hasSettled() {
        require(now > (channelEnd + 1 days));
        _;
    }
    
    modifier inSettlementPeriod() {
        require(now > channelEnd && now <= (channelEnd + 1 days));
        _;
    }

    modifier hasNotSettle() {
        require(now <= (channelEnd + 1 days));
        _;
    }
}