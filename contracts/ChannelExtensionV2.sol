pragma solidity ^0.4.23;

import "./Multiownable.sol";
import "./CryptoHandler.sol";
import "./Expirable.sol";

contract Channel is Multiownable, CryptoHandler, Expirable {

    event channelCreated(address indexed nearEnd, address indexed farEnd,
    uint256 value, uint256 id, uint256 endDate);

    event channelClosed(address indexed NearEnd, uint256 nearEndFinalValue, address indexed FarEnd,
    uint256 farEndFinalValue, uint256 finalId);

    event closeRequest(address indexed end, bool closeChange);

    event stateUpdated(address indexed NearEnd, uint256 nearEndValue, address indexed FarEnd,
    uint256 farEndValue, uint256 currentId);

    event disputeAccepted(address indexed end, uint256 currentId);

    event rsShownAndUsed(bytes32[] randomsSigned, bytes32[] randoms, bytes32[] hashes, bool[] correctRs);

    event channelAccepted(uint256 farEndValue, uint256 totalValue);

    struct State {
        mapping(address=> uint256) values;
        uint256 id;
    }

    State state;

    uint256 public channelValue;
    bool public closed;
    bool public accepted;

    mapping(address => bool) public requestedClose;
    mapping(address => bool) disputed;

    constructor (address _nearEnd, address _farEnd, uint256 _daysOpen)
        Multiownable([_nearEnd, _farEnd]) Expirable(_daysOpen) public payable {

        state.values[_nearEnd] = msg.value;
        channelValue = msg.value;

        emit channelCreated(_nearEnd, _farEnd, msg.value, state.id, channelEnd);
    }

    function acceptChannel() public payable onlyOwners notAccepted hasNotExpired{

        require(msg.sender == owners[1]);
        accepted = true;

        state.values[owners[1]] = msg.value;
        channelValue += msg.value;

        emit channelAccepted(msg.value, channelValue);
    }

    function updateState(address[2] _end_chann, uint256[2] _values_id, bytes32 _msgHash, uint8 _v, bytes32[2] _r_s, bytes32[] _rsSigned, bytes32[] _rs, bytes32[] _hs, uint256[] _ttls, int256[] _rhValues)
        public onlyOwners isAccepted notClosed hasNotExpired {

        /**
            Require signer == otherEnd
            Require channel == thisChannel
        */
        address checkEnd = getOtherOwner(msg.sender);
        require(_end_chann[0] == checkEnd && _end_chann[1] == address(this));
        /**
            Compute message hash
            Require previousHash = _msgHash
            Require valid signature
        */
        require(uint8(_hs.length) < limit);

        bytes32 msgHash;

        if(_rsSigned.length > 0)
          msgHash = computeHash(_values_id, _end_chann, _rsSigned, _hs, _ttls,  _rhValues);
        else
          msgHash = computeHash(_values_id, _end_chann, _hs, _ttls,  _rhValues);

        require(verifySignature(_end_chann[0], prefixSignHash(_msgHash), _v, _r_s[0], _r_s[1]));

        /**
            Require sent value inferior to channel's value
            Require new state with higher id than state, overwriting the old state
        */
        require(_values_id[0] <= channelValue && _values_id[1] > state.id);

        /**
            Update state (id, values)
        */
        state.id = _values_id[1];
        state.values[_end_chann[0]] = _values_id[0];
        state.values[msg.sender] = channelValue - _values_id[0];

        checkRshashesIn_hs(_rsSigned, _rs, _hs, _ttls, _rhValues);

        emit stateUpdated(msg.sender, state.values[msg.sender], _end_chann[0], state.values[checkEnd], state.id);
    }

    function closeChannel(bool _close) public onlyOwners isAccepted notClosed hasNotSettle {
        if(_close && requestedClose[getOtherOwner(msg.sender)]) {
            // 1. Conditions
            // Part of the modifiers

            // 2. Effects
            closed = true;
            emit channelClosed(owners[0], state.values[owners[0]], owners[1], state.values[owners[1]], state.id);

            // 3. Interaction
            if (state.values[owners[0]] > 0)
                owners[0].transfer(state.values[owners[0]]);
            if (state.values[owners[1]] > 0)
                owners[1].transfer(state.values[owners[1]]);
        } else {
            emit closeRequest(msg.sender, _close);
            requestedClose[msg.sender] = _close;
        }
    }

    function unlockFunds() public onlyOwners notClosed hasSettled {
        // 1. Conditions
        // Part of the modifiers

        // 2. Effects
        closed = true;
        emit channelClosed(owners[0], state.values[owners[0]], owners[1], state.values[owners[1]], state.id);

        // 3. Interaction
        if (state.values[owners[0]] > 0)
            owners[0].transfer(state.values[owners[0]]);
        if (state.values[owners[1]] > 0)
            owners[1].transfer(state.values[owners[1]]);
    }

    function disputeState(address[2] _end_chann, uint256[2] _values_id, bytes32 _msgHash, uint8 _v, bytes32[2] _r_s, bytes32[] _rsSigned, bytes32[] _rs, bytes32[] _hs, uint256[] _ttls, int256[] _rhValues)
        public onlyOwners isAccepted notClosed inSettlementPeriod {

        require(disputed[msg.sender] == false);

        /**
            Require signer == otherEnd
            Require channel == thisChannel
        */
        address checkEnd = getOtherOwner(msg.sender);
        require(_end_chann[0] == checkEnd && _end_chann[1] == address(this));
        /**
            Compute message hash
            Require previousHash = _msgHash
            Require valid signature
        */

        require(uint8(_hs.length) < limit);

        bytes32 msgHash;

        if(_rsSigned.length > 0)
          msgHash = computeHash(_values_id, _end_chann, _rsSigned, _hs, _ttls,  _rhValues);
        else
          msgHash = computeHash(_values_id, _end_chann, _hs, _ttls,  _rhValues);

        require(verifySignature(_end_chann[0], prefixSignHash(_msgHash), _v, _r_s[0], _r_s[1]));

        /**
            Require sent value inferior to channel's value
            Require new state with higher id than state, overwriting the old state
        */
        require(_values_id[0] <= channelValue && _values_id[1] > state.id);

        /**
            Update state (id, values)
        */
        state.id = _values_id[1];
        state.values[_end_chann[0]] = _values_id[0];
        state.values[msg.sender] = channelValue - _values_id[0];

        checkRshashesIn_hs(_rsSigned, _rs, _hs, _ttls, _rhValues);

        emit disputeAccepted(msg.sender, state.id);

        disputed[msg.sender] = true;
    }

    function checkRshashesIn_hs(bytes32[] _rsSigned, bytes32[] _rs, bytes32[] _hs, uint256[] _ttls, int256[] _rhValues) internal {
        int256 values;
        bool[] memory RtoH;
        uint8 i = 0;

        for(i; i < _rsSigned.length; i++) {
            if(_rsSigned[i] != 0x0 && verifyHash(_rsSigned[i], _hs[i])) {

                if(uint(_rhValues[i]) <= channelValue && now >= _ttls[i]) {
                    values += _rhValues[i];
                    RtoH[i] = true;
                }

            }
        }

        for(uint8 j = i; j < (i + _rs.length); j++) {
            if(_rs[j-i] != 0x0 && verifyHash(_rs[j-i], _hs[j])) {

                if(uint(_rhValues[j]) <= channelValue && now >= _ttls[j]) {
                    values += _rhValues[j];
                    RtoH[j] = true;
                }

            }
        }

        address higherAddrs;
        if(values >= 0) {
            higherAddrs = owners[0];
        } else {
            values = values - 2*values;
            higherAddrs = owners[1];
        }

        if(values > 0) {
            require(uint(values) <= state.values[higherAddrs]);
            state.values[higherAddrs] -= uint(values);
            state.values[getOtherOwner(higherAddrs)] += uint(values);

            emit rsShownAndUsed(_rsSigned, _rs, _hs, RtoH);
        }

    }

    modifier notClosed() {
        require(!closed);
        _;
    }

    modifier isAccepted() {
        require(accepted);
        _;
    }

    modifier notAccepted(){
        require(!accepted);
        _;
    }

    /**Internal state getters*/
    function getStateId() public view returns (uint256) {
        return state.id;
    }
    function getStateValues() public view returns ( uint256[2]) {
        return ([state.values[owners[0]], state.values[owners[1]]]);
    }
    /***/
}
