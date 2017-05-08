/*
 * Test for Custodial Smart Contract deployment.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

tests.push ({
  name: "CustodialDeployment",
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
    { name: "Alice deploys CustodialWrapper contract with fee factor 0",
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
          web3.toBigNumber ("0"),
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

        assert (
          'web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length > 2',
          web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length > 2);

        test.custodialWrapper = test.custodialWrapperContract.at (
          web3.eth.getTransactionReceipt (test.tx).contractAddress);
      }},
    { name: "Alice deposits 1 ETH to the smart contract",
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (0) == 0',
          test.custodialWrapper.getCapital (0) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.custodialWrapper.deposit (
            {from: test.alice, value: web3.toWei ("1", "ether")});
      }},
    { name: "Make sure capital is now 1 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        test.depositTimestamp = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockHash).timestamp;

        assert (
          'test.custodialWrapper.getCapital (0).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (0).eq (web3.toWei ("1", "ether")));
      }},
    { name: "Make sure capital is 0 ETH 1 second after deploynment",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (test.depositTimestamp + 1).eq (web3.toWei ("0", "ether"))',
          test.custodialWrapper.getCapital (test.depositTimestamp + 1).eq (web3.toWei ("0", "ether")));
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

        assert (
          'web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length > 2',
          web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length > 2);

        test.custodialWrapper = test.custodialWrapperContract.at (
          web3.eth.getTransactionReceipt (test.tx).contractAddress);
      }},
    { name: "Alice deposits 1 ETH to the smart contract",
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (0) == 0',
          test.custodialWrapper.getCapital (0) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.custodialWrapper.deposit (
            {from: test.alice, value: web3.toWei ("1", "ether")});
      }},
    { name: "Make sure capital is now 1 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        test.depositTimestamp = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockHash).timestamp;

        assert (
          'test.custodialWrapper.getCapital (0).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (0).eq (web3.toWei ("1", "ether")));
      }},
    { name: "Make sure capital is 0.5 ETH 1 second after deploynment",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (test.depositTimestamp + 1).eq (web3.toWei ("0.5", "ether"))',
          test.custodialWrapper.getCapital (test.depositTimestamp + 1).eq (web3.toWei ("0.5", "ether")));
      }},
    { name: "Alice deploys CustodialWrapper contract with fee factor 1-(1/2^128)",
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
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
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

        assert (
          'web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length > 2',
          web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length > 2);

        test.custodialWrapper = test.custodialWrapperContract.at (
          web3.eth.getTransactionReceipt (test.tx).contractAddress);
      }},
    { name: "Alice deposits 1 ETH to the smart contract",
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (0) == 0',
          test.custodialWrapper.getCapital (0) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.custodialWrapper.deposit (
            {from: test.alice, value: web3.toWei ("1", "ether")});
      }},
    { name: "Make sure capital is now 1 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        test.depositTimestamp = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockHash).timestamp;

        assert (
          'test.custodialWrapper.getCapital (0).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (0).eq (web3.toWei ("1", "ether")));
      }},
    { name: "Make sure capital is 1 ETH 1 second after deploynment",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (test.depositTimestamp + 1).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (test.depositTimestamp + 1).eq (web3.toWei ("1", "ether")));
      }},
    { name: "Make sure capital is 0.999999999767169356 ETH 2^96 seconds after deploynment",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (web3.toBigNumber (test.depositTimestamp).add ("0x1000000000000000000000000")).eq (web3.toWei ("0.999999999767169356", "ether"))',
          test.custodialWrapper.getCapital (web3.toBigNumber (test.depositTimestamp).add ("0x1000000000000000000000000")).eq (web3.toWei ("0.999999999767169356", "ether")));
      }},
    { name: "Alice deploys CustodialWrapper contract with fee factor 1",
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
          web3.toBigNumber ("0x100000000000000000000000000000000"),
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

        assert (
          'web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length > 2',
          web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length > 2);

        test.custodialWrapper = test.custodialWrapperContract.at (
          web3.eth.getTransactionReceipt (test.tx).contractAddress);
      }},
    { name: "Alice deposits 1 ETH to the smart contract",
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (0) == 0',
          test.custodialWrapper.getCapital (0) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.custodialWrapper.deposit (
            {from: test.alice, value: web3.toWei ("1", "ether")});
      }},
    { name: "Make sure capital is now 1 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        test.depositTimestamp = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockHash).timestamp;

        assert (
          'test.custodialWrapper.getCapital (0).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (0).eq (web3.toWei ("1", "ether")));
      }},
    { name: "Make sure capital is 1 ETH 1 second after deploynment",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (test.depositTimestamp + 1).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (test.depositTimestamp + 1).eq (web3.toWei ("1", "ether")));
      }},
    { name: "Make sure capital is 1 ETH 2^96 seconds after deploynment",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        assert (
          'test.custodialWrapper.getCapital (web3.toBigNumber (test.depositTimestamp).add ("0x1000000000000000000000000")).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (web3.toBigNumber (test.depositTimestamp).add ("0x1000000000000000000000000")).eq (web3.toWei ("1", "ether")));
      }},
    { name: "Alice withdrawas fee from the smart contract",
      body: function (test) {
        assert (
          'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
          web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
          'test.custodialWrapper.getCapital (web3.toBigNumber (test.depositTimestamp)).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (web3.toBigNumber (test.depositTimestamp)).eq (web3.toWei ("1", "ether")));

        personal.unlockAccount (test.alice, "");
        test.tx = test.custodialWrapper.withdrawFee (
            {from: test.alice});
      }},
    { name: "Make sure fee withdrawal succeeded but no ether were transferred",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        var resultEvents = test.custodialWrapper.Result (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
          web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
          'test.custodialWrapper.getCapital (web3.toBigNumber (test.depositTimestamp)).eq (web3.toWei ("1", "ether"))',
          test.custodialWrapper.getCapital (web3.toBigNumber (test.depositTimestamp)).eq (web3.toWei ("1", "ether")));
      }},
    { name: "Alice tries to deploy CustodialWrapper contract with fee factor 1+1/2^128",
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
          web3.toBigNumber ("0x100000000000000000000000000000001"),
          {from: test.alice, data: custodialWrapperCode, gas:1000000}).
          transactionHash;
      }},
    { name: "Make sure contract was not deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx).contractAddress',
          web3.eth.getTransactionReceipt (test.tx).contractAddress);

        assert (
          'web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length == 2',
          web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length == 2);
      }},
    { name: "Alice tries to deploy CustodialWrapper contract with fee factor 2^128-1",
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
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
          {from: test.alice, data: custodialWrapperCode, gas:1000000}).
          transactionHash;
      }},
    { name: "Make sure contract was not deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx).contractAddress',
          web3.eth.getTransactionReceipt (test.tx).contractAddress);

        assert (
          'web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length == 2',
          web3.eth.getCode (web3.eth.getTransactionReceipt (test.tx).contractAddress).length == 2);
      }}
  ]});
