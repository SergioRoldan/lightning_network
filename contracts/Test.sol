pragma solidity ^0.4.21;
import "./CryptoHandler.sol";

contract Test is CryptoHandler {
    
    event addNeg(int neg);
    event comHash(bytes32 hash, bytes32 expected, bool compare);
    event kec(bytes32 keck);
    event double(bytes32 first);

    int public str;
    
    function addNegatives(int first, int second) public {
        emit addNeg(first + second);
    }

    function storeNegatives(int _str) public {
        str = _str;
    }
    
    function testing1(uint256[2] _values_id, address[2] _end_chann, bytes32 _msgHash, bytes32[] _hs, uint256[] _ttls, int256[] _rhValues) public {
        bytes32 msgHash = computeHash(_values_id, _end_chann, _hs, _ttls, _rhValues);
        emit comHash(msgHash, _msgHash, (msgHash == _msgHash));
    }
    
    function testing2(uint256 _values, uint256 _id, address _end, address _chann, bytes32 _msgHash) public {
        bytes32 msgHash = computeHash(_values, _id, _end, _chann);
        emit comHash(msgHash, _msgHash, (msgHash == _msgHash));
    }
    
    function computeHash(uint256 _values, uint256 _id, address _end, address _chann) internal pure returns (bytes32) {
        return keccak256(_values, _id, _end, _chann);
    }
    
    function computezsaHash(bytes32 lsls) public {
        emit kec(keccak256(lsls));
    }
    
    function asdf(uint256[] sad, address[] ad, bytes32 by) public {
        emit double(keccak256(sad, ad, by));
    }
}