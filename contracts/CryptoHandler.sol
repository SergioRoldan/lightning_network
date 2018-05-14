pragma solidity ^0.4.23;

contract CryptoHandler{

    bytes constant msgSignPrefix = "\x19Ethereum Signed Message:\n32";
    uint8 constant limit = 10; //change this

    function computeHash(uint256[2] _uints256, address[2] _addresses) internal pure returns (bytes32) {
        return keccak256(_uints256, _addresses);
    }

    function computeHash(uint256[2] _firstUints256, address[2] _firstAddresses, bytes32[] _firstBytes32, uint256[] _secondUint256, int256[] _firstInt256)
        internal pure returns (bytes32) {
        return keccak256(_firstUints256, _firstAddresses, _firstBytes32, _secondUint256, _firstInt256);
    }

    function computeHash(uint256[2] _firstUints256, address[2] _firstAddresses, bytes32[] _firstBytes32, bytes32[] _secondBytes32, uint256[] _secondUint256, int256[] _firstInt256)
        internal pure returns (bytes32) {
        return keccak256(_firstUints256, _firstAddresses, _firstBytes32, _secondBytes32, _secondUint256, _firstInt256);
    }

    function computeHash(bytes32 _msg) internal pure returns (bytes32) {
        return keccak256(_msg);
    }

    function verifySignature(address _addr, bytes32 _msgHash, uint8 _v, bytes32 _r, bytes32 _s) internal pure returns (bool) {
        return recoverAddrFromSign(_msgHash, _v, _r, _s) == _addr;
    }

    function verifyHash(bytes32 _msg, bytes32 _msgHash) internal pure returns (bool) {
        return computeHash(_msg) == _msgHash;
    }

    function verifyBytes32(bytes32 _firstHash, bytes32 _secondHash) internal pure returns (bool) {
        return _firstHash == _secondHash;
    }

    function recoverAddrFromSign(bytes32 _msgHash, uint8 _v, bytes32 _r, bytes32 _s) internal pure returns (address) {
        return ecrecover(_msgHash, _v, _r, _s);
    }

    function prefixSignHash(bytes32 _msgHash) internal pure returns (bytes32) {
        return keccak256(msgSignPrefix, _msgHash);
    }

}
