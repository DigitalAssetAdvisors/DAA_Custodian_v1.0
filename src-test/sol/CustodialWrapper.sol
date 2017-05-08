/*
 * Wrapper for Custodial Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */
pragma solidity ^0.4.10;

import "./../../src/sol/Custodial.sol";

/**
 * Wrapper for Custodial Smart Contract.
 */
contract CustodialWrapper is Custodial {
  /**
   * Create new Custodial Wrapper contract with given client address, advisor
   * address and fee factor.
   *
   * @param _client client address
   * @param _advisor advisor address
   * @param _feeFactor fee factor
   */
  function CustodialWrapper (address _client, address _advisor, uint256 _feeFactor) 
  Custodial (_client, _advisor, _feeFactor) {
      // Do nothing
  }

  /**
   * Deposit ether exceeding capital limit.
   */
  function depositExceedCapitalLimit () payable {
    capitalTimestamp = now - 1;
    while (true) {
      uint256 extraCapital = TWO_128 - getCapital (now) - msg.value;
      if (extraCapital == 0) break;
      capital += extraCapital;
    }
    deposit ();
  }

  /**
   * Deposit ether not exceeding capital limit.
   */
  function depositNotExceedCapitalLimit () payable {
    capitalTimestamp = now - 1;
    while (true) {
      uint256 extraCapital = TWO_128 - getCapital (now) - msg.value - 1;
      if (extraCapital == 0) break;
      capital += extraCapital;
    }
    deposit ();
  }

  /**
   * Withdraw ether from client's account and sent it to the client's address.
   * May only be called by client.
   *
   * @param _value value to withdraw (in Wei)
   * @return true if ether was successfully withdrawn, false otherwise
   */
  function withdraw (uint256 _value)
  returns (bool _success) {
    _success = Custodial.withdraw (_value);
    Result (_success);
  }

  /**
   * Withdraw all ether from client's account and sent it to the client's
   * address.  May only be called by client.
   *
   * @return true if ether was successfully withdrawn, false otherwise
   */
  function withdrawAll ()
  returns (bool _success) {
    if (msg.sender != client) throw;

    _success = Custodial.withdrawAll ();
    Result (_success);
  }

  /**
   * Withdraw fee charged by the contract as well as all unaccounted ether on
   * contract's balance and send it to the advisor's address.  May only be
   * called by advisor.
   *
   * @return true if fee and unaccounted ether was successfully withdrawn,
   *          false otherwise
   */
  function withdrawFee ()
  returns (bool _success) {
    _success = Custodial.withdrawFee ();
    Result (_success);
  }

  /**
   * Multiply _a by _b / 2^128.  Parameter _a should be less than or equal to
   * 2^128 and parameter _b should be less than 2^128.
   *
   * @param _a left argument
   * @param _b right argument
   * @return _a * _b / 2^128
   */
  function doMul (uint256 _a, uint256 _b)
  constant returns (bool _success, uint256 _result) {
    return (true, mul (_a, _b));
  }

  /**
   * Calculate (_a / 2^128)^_b * 2^128.  Parameter _a should be less than 2^128.
   *
   * @param _a left argument
   * @param _b right argument
   * @return (_a / 2^128)^_b * 2^128
   */
  function doPow (uint256 _a, uint256 _b)
  constant returns (bool _success, uint256 _result) {
    return (true, pow (_a, _b));
  }

  /**
   * Holds result of operation.
   *
   * @param _value result of operation
   */
  event Result (bool _value);
}
