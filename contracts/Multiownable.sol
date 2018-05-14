pragma solidity ^0.4.23;

contract Multiownable {
    
    address[2] public owners;
    
    constructor (address[2] _owners) internal {
        
        owners = _owners;
    }
    
    function getOtherOwner(address _owner)  internal view returns (address){

        if(_owner == owners[0]) 
            return owners[1];
        else if (_owner == owners[1]) 
            return owners[0]; 
        
        return 0x0;

    }
    
    modifier onlyOwners(){
        
        require(msg.sender == owners[0] || msg.sender == owners[1]);
        _;

    }
    
}