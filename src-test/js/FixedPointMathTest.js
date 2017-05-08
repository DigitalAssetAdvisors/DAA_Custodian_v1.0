/*
 * Test for fixed point math implemented inside Custodial Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

tests.push ({
  name: "FixedPointMath",
  steps: [
    { name: "Ensure there is at least one account: Alice",
      body: function (test) {
        while (web3.eth.accounts == null || web3.eth.accounts.length < 1)
          personal.newAccount ("");

        test.alice = web3.eth.accounts [0];
      }},
    { name: "Ensure Alice has at least 5 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getBalance (test.alice).gte (web3.toWei ("5", "ether"));
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice deploys CustodialWrapper contract",
      body: function (test) {
        loadScript ("target/test-solc-js/CustodialWrapper.abi.js");
        var custodialWrapperABI = _;
        loadScript ("target/test-solc-js/CustodialWrapper.bin.js");
        var custodialWrapperCode = _;
        test.custodialWrapperContract = web3.eth.contract (custodialWrapperABI);

        personal.unlockAccount (test.alice, "");
        test.tx = test.custodialWrapperContract.new (
          test.alice,
          test.alice,
          web3.toBigNumber ("0x80000000000000000000000000000000"),
          {from: test.alice, data: custodialWrapperCode, gas:1000000}).
          transactionHash;
      }},
    { name: "Make sure contract was deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx).contractAddress',
          web3.eth.getTransactionReceipt (test.tx).contractAddress);

        test.custodialWrapper = test.custodialWrapperContract.at (
          web3.eth.getTransactionReceipt (test.tx).contractAddress);
      }},
    { name: "Multiply 0 by 0.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 0 by 1.0/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 0 by 0.5-(2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 0 by 0.5",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("0x80000000000000000000000000000000"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 0 by (2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 0 by 1.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 0 by 2^128-1",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 1 by 0.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 1 by 1.0/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 1 by 0.5-(2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 1 by 0.5",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("0x80000000000000000000000000000000"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("1").eq (result [1])',
          web3.toBigNumber ("1").eq (result [1]));
      }},
    { name: "Multiply 1 by (2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("1").eq (result [1])',
          web3.toBigNumber ("1").eq (result [1]));
      }},
    { name: "Multiply 1 by 1.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 1 by 2^128-1",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 13 by 0.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("13"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 13 by 1.0/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("13"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 13 by 0.5-(2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("13"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("6").eq (result [1])',
          web3.toBigNumber ("6").eq (result [1]));
      }},
    { name: "Multiply 13 by 0.5",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("13"), web3.toBigNumber ("0x80000000000000000000000000000000"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("7").eq (result [1])',
          web3.toBigNumber ("7").eq (result [1]));
      }},
    { name: "Multiply 13 by (2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("13"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("13").eq (result [1])',
          web3.toBigNumber ("13").eq (result [1]));
      }},
    { name: "Multiply 13 by 1.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("13"), web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 13 by 2^128-1",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("13"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128-1 by 0.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 2^128-1 by 1.0/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("1").eq (result [1])',
          web3.toBigNumber ("1").eq (result [1]));
      }},
    { name: "Multiply 2^128-1 by 0.5-(2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Multiply 2^128-1 by 0.5",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0x80000000000000000000000000000000"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x80000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0x80000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Multiply 2^128-1 by (2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE").eq (result [1]));
      }},
    { name: "Multiply 2^128-1 by 1.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128-1 by 2^128-1",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128 by 0.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Multiply 2^128 by 1.0/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("1").eq (result [1])',
          web3.toBigNumber ("1").eq (result [1]));
      }},
    { name: "Multiply 2^128 by 0.5-(2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Multiply 2^128 by 0.5",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("0x80000000000000000000000000000000"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x80000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0x80000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Multiply 2^128 by (2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Multiply 2^128 by 1.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128 by 2^128-1",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128+1 by 0.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000001"), web3.toBigNumber ("0"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128+1 by 1.0/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000001"), web3.toBigNumber ("1"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128+1 by 0.5-(2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000001"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128+1 by 0.5",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000001"), web3.toBigNumber ("0x80000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128+1 by (2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000001"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128+1 by 1.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000001"), web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^128+1 by 2^128-1",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0x100000000000000000000000000000001"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^256-1 by 0.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^256-1 by 1.0/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("1"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^256-1 by 0.5-(2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^256-1 by 0.5",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0x80000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^256-1 by (2^128-1)/2^128",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^256-1 by 1.0",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Multiply 2^256-1 by 2^128-1",
      body: function (test) {
        var result = test.custodialWrapper.doMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate 0^0",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x100000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0x100000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Calculate 0^1",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate 0^13",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0"), web3.toBigNumber ("13"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate 0^123456789",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0"), web3.toBigNumber ("123456789"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate 0^(2^256-1)",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate (1/2^128)^0",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("1"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x100000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0x100000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Calculate (1/2^128)^1",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("1"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("1").eq (result [1])',
          web3.toBigNumber ("1").eq (result [1]));
      }},
    { name: "Calculate (1/2^128)^13",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("1"), web3.toBigNumber ("13"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate (1/2^128)^123456789",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("1"), web3.toBigNumber ("123456789"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate (1/2^128)^(2^256-1)",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("1"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate 0.5^0",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x80000000000000000000000000000000"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x100000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0x100000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Calculate 0.5^1",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x80000000000000000000000000000000"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x80000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0x80000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Calculate 0.5^13",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x80000000000000000000000000000000"), web3.toBigNumber ("13"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x00080000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0x00080000000000000000000000000000").eq (result [1]));
      }},
    { name: "Calculate 0.5^123456789",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x80000000000000000000000000000000"), web3.toBigNumber ("123456789"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate 0.5^(2^256-1)",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x80000000000000000000000000000000"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate (2^128-1)^0",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0x100000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0x100000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Calculate (2^128-1)^1",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Calculate (2^128-1)^13",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("13"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF3").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF3").eq (result [1]));
      }},
    { name: "Calculate (2^128-1)^123456789",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("123456789"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xfffffffffffffffffffffffff8a432eb").eq (result [1])',
          web3.toBigNumber ("0xfffffffffffffffffffffffff8a432eb").eq (result [1]));
      }},
    { name: "Calculate (2^128-1)^(2^256-1)",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Calculate (2^128)^0",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("0"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^128)^1",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("1"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^128)^13",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("13"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^128)^123456789",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("123456789"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^128)^(2^256-1)",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0x100000000000000000000000000000000"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^256-1)^0",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^256-1)^1",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("1"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^256-1)^13",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("13"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^256-1)^123456789",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("123456789"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Calculate (2^256-1)^(2^256-1)",
      body: function (test) {
        var result = test.custodialWrapper.doPow (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }}
  ]});
