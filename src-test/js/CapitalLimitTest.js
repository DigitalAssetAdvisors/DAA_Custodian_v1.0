/*
 * Test for Custodial Smart Contract capital limit.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

tests.push ({
  name: "CapitalLimit",
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
    { name: "Alice deploys CustodialWrapper contract with fee factor 0.5",
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
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFF00000000"),
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
    { name: "Alice deploys Wallet contract: Bob",
      body: function (test) {
        loadScript (
          "target/test-solc-js/Wallet.abi.js");
        var walletABI = _;
        loadScript (
          "target/test-solc-js/Wallet.bin.js");
        var walletCode = _;
        test.walletContract =
          web3.eth.contract (walletABI);

        personal.unlockAccount (test.alice, "");
        test.tx = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
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

        test.bob = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx).contractAddress);
      }},
    { name: "Bob tries to deposit 1 ETH exceeding capital limit",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.depositExceedCapitalLimit.getData (),
            web3.toWei ("1", "ether"),
            {from: test.alice, value: web3.toWei ("1", "ether"), gas: 4000000});
      }},
    { name: "Make sure deposit failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);

        var depositEvents = test.custodialWrapper.Deposit (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'depositEvents.length == 0',
          depositEvents.length == 0);
      }},
    { name: "Bob deposits 1 ETH not exceeding capital limit",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.depositNotExceedCapitalLimit.getData (),
            web3.toWei ("1", "ether"),
            {from: test.alice, value: web3.toWei ("1", "ether"), gas: 4000000});
      }},
    { name: "Make sure deposit succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var depositEvents = test.custodialWrapper.Deposit (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'depositEvents.length == 1',
          depositEvents.length == 1);

        assert (
          'depositEvents [0].args.from == test.bob.address',
          depositEvents [0].args.from == test.bob.address);

        assert (
          'depositEvents [0].args.value.eq(web3.toWei ("1", "ether"))',
          depositEvents [0].args.value.eq(web3.toWei ("1", "ether")));
      }}
  ]});
