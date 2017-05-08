/*
 * Test for Custodial Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

var two128 = web3.toBigNumber ("0x100000000000000000000000000000000");
var two127 = web3.toBigNumber ("0x80000000000000000000000000000000");

function mul (a, b) {
  a = web3.toBigNumber (a);
  b = web3.toBigNumber (b);
  return a.mul (b).add (two127).divToInt (two128);
}

function pow (a, b) {
  a = web3.toBigNumber (a);
  var r = two128;
  while (b > 0) {
    if (b % 2 == 1) {
      r = mul (r, a);
      b -= 1;
    } else {
      a = mul (a, a);
      b = Math.floor (b / 2);
    }
  }
  return r;
}

function chargeFee (a, b) {
  a = web3.toBigNumber (a);
  return mul (a, pow ('0xFFFFFFFF000000000000000000000000', b));
}

tests.push ({
  name: "Custodial",
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
    { name: "Alice deploys three Wallet contracts: Bob, Carol, and Dave",
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
        test.tx1 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx2 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx3 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
      }},
    { name: "Make sure contracts were deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx1) &&
            web3.eth.getTransactionReceipt (test.tx2) &&
            web3.eth.getTransactionReceipt (test.tx3);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx1).contractAddress',
          web3.eth.getTransactionReceipt (test.tx1).contractAddress);

        assert (
          'web3.eth.getTransactionReceipt (test.tx2).contractAddress',
          web3.eth.getTransactionReceipt (test.tx2).contractAddress);

        assert (
          'web3.eth.getTransactionReceipt (test.tx3).contractAddress',
          web3.eth.getTransactionReceipt (test.tx3).contractAddress);

        test.bob = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx1).contractAddress);

        test.carol= test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx2).contractAddress);

        test.dave = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx3).contractAddress);
      }},
    { name: "Alice deploys CustodialWrapper contract with bob as a client, carol as an advisor, and fee factor 1-1/2^32",
      body: function (test) {
        loadScript ("target/test-solc-js/CustodialWrapper.abi.js");
        var custodialWrapperABI = _;
        loadScript ("target/test-solc-js/CustodialWrapper.bin.js");
        var custodialWrapperCode = _;
        test.custodialWrapperContract = web3.eth.contract (custodialWrapperABI);

        personal.unlockAccount (test.alice, "");
        test.tx = test.custodialWrapperContract.new (
          test.bob.address,
          test.carol.address,
          web3.toBigNumber ("0xFFFFFFFF000000000000000000000000"),
          {from: test.alice, data: custodialWrapperCode, gas:2000000}).
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
    { name: "Dave deposits 0 Wei",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address) == 0',
            web3.eth.getBalance (test.custodialWrapper.address) == 0);

        assert (
            'test.custodialWrapper.getCapital (0) == 0',
            test.custodialWrapper.getCapital (0) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.deposit.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure deposit succeeded but no event were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
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
          'depositEvents.length == 0',
          depositEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address) == 0',
            web3.eth.getBalance (test.custodialWrapper.address) == 0);

        assert (
            'test.custodialWrapper.getCapital (0) == 0',
            test.custodialWrapper.getCapital (0) == 0);
      }},
    { name: "Dave deposits 1 ETH",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address) == 0',
            web3.eth.getBalance (test.custodialWrapper.address) == 0);

        assert (
            'test.custodialWrapper.getCapital (0) == 0',
            test.custodialWrapper.getCapital (0) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.deposit.getData (),
            web3.toWei ("1", "ether"),
            {from: test.alice, value: web3.toWei ("1", "ether"), gas: 1000000});
      }},
    { name: "Make sure deposit succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.ts1 = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockNumber).timestamp;
        test.capital = web3.toWei ("1", "ether");

        var execResultEvents = test.dave.Result (
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
          'depositEvents [0].args.from == test.dave.address',
          depositEvents [0].args.from == test.dave.address);

        assert (
          'depositEvents [0].args.value.eq (web3.toWei ("1", "ether"))',
          depositEvents [0].args.value.eq (web3.toWei ("1", "ether")));

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts1).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts1).eq (test.capital));

        assert (
            'test.custodialWrapper.getCapital (test.ts1 + 13).eq (chargeFee (test.capital, 13))',
            test.custodialWrapper.getCapital (test.ts1 + 13).eq (chargeFee (test.capital, 13)));
      }},
    { name: "Alice tells Carol to accept payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.setAcceptsPayments (
            true,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Carol tries to withdraw 0.5 ETH but she is not the client of smart contract",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts1).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts1).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.carol.address) == 0',
            web3.eth.getBalance (test.carol.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdraw.getData (web3.toWei ("0.5", "ether")),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction was cancelled",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.carol.Result (
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

        var resultEvents = test.custodialWrapper.Result (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 0',
          resultEvents.length == 0);

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 0',
          withdrawalEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts1).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts1).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.carol.address) == 0',
            web3.eth.getBalance (test.carol.address) == 0);
      }},
    { name: "Bob tries to withdraw 0.5 ETH but he does not accept payments",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts1).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts1).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address) == 0',
            web3.eth.getBalance (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdraw.getData (web3.toWei ("0.5", "ether")),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.ts2 = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockNumber).timestamp;
        test.capital = chargeFee (test.capital, test.ts2 - test.ts1);

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
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 0',
          withdrawalEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts2).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts2).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address) == 0',
            web3.eth.getBalance (test.bob.address) == 0);
      }},
    { name: "Alice tells Bob to accept payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.setAcceptsPayments (
            true,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Bob tries to withdraw 1 ETH but this is more than current client's capital",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts2).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts2).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address) == 0',
            web3.eth.getBalance (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdraw.getData (web3.toWei ("1", "ether")),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.ts3 = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockNumber).timestamp;
        test.capital = chargeFee (test.capital, test.ts3 - test.ts2);

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
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 0',
          withdrawalEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts3).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts3).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address) == 0',
            web3.eth.getBalance (test.bob.address) == 0);
      }},
    { name: "Bob withdraws 0 ETH",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts3).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts3).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address) == 0',
            web3.eth.getBalance (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdraw.getData (0),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded but no events were logged",
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

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 0',
          withdrawalEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts3).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts3).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address) == 0',
            web3.eth.getBalance (test.bob.address) == 0);
     }},
    { name: "Bob withdraws 0.5 ETH",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("1", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts3).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts3).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address) == 0',
            web3.eth.getBalance (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdraw.getData (web3.toWei ("0.5", "ether")),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.ts4 = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockNumber).timestamp;
        test.capital = chargeFee (test.capital, test.ts4 - test.ts3).sub (web3.toWei ("0.5", "ether"));

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

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 1',
          withdrawalEvents.length == 1);

        assert (
          'withdrawalEvents [0].args.value.eq (web3.toWei ("0.5", "ether"))',
          withdrawalEvents [0].args.value.eq (web3.toWei ("0.5", "ether")));

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts4).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts4).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether")));
      }},
    { name: "Bob tries to withdraw fee but he is not the advisor of smart contract",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts4).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts4).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether")));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdrawFee.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction was cancelled",
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

        var resultEvents = test.custodialWrapper.Result (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 0',
          resultEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts4).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts4).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether")));
      }},
    { name: "Alice tells Carol to refuse payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.setAcceptsPayments (
            false,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Carol tries to withdraw fee but she does not accept payments",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts4).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts4).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.carol.address) == 0',
            web3.eth.getBalance (test.carol.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdrawFee.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.ts5 = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockNumber).timestamp;

        var execResultEvents = test.carol.Result (
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
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts5).eq (chargeFee (test.capital, test.ts5 - test.ts4))',
            test.custodialWrapper.getCapital (test.ts5).eq (chargeFee (test.capital, test.ts5 - test.ts4)));

        assert (
            'web3.eth.getBalance (test.carol.address) == 0',
            web3.eth.getBalance (test.carol.address) == 0);
      }},
    { name: "Alice tells Carol to accept payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.setAcceptsPayments (
            true,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Carol withdraws fee",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (web3.toWei ("0.5", "ether")));

        assert (
            'test.custodialWrapper.getCapital (test.ts5).eq (chargeFee (test.capital, test.ts5 - test.ts4))',
            test.custodialWrapper.getCapital (test.ts5).eq (chargeFee (test.capital, test.ts5 - test.ts4)));

        assert (
            'web3.eth.getBalance (test.carol.address) == 0',
            web3.eth.getBalance (test.carol.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdrawFee.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure fee was withdrawn",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.ts6 = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockNumber).timestamp;

        var execResultEvents = test.carol.Result (
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
            'web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether")));
      }},
    { name: "Carol tries to terminate smart contract, but client's capital is not zero",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether")));

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.terminate.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transacton was cancelled",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.carol.Result (
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

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether")));
      }},
    { name: "Carol tries to withdraw all the capital but she is not the client of smart contract",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether")));

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdrawAll.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction was calcelled",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.carol.Result (
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

        var resultEvents = test.custodialWrapper.Result (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 0',
          resultEvents.length == 0);

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 0',
          withdrawalEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.carol.address).add (chargeFee (test.capital, test.ts6 - test.ts4)).eq (web3.toWei ("0.5", "ether")));
      }},
    { name: "Alice tells Bob to refuse payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.setAcceptsPayments (
            false,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Bob tries to withdraw all the capital but he does not currently accept payments",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4))',
            test.custodialWrapper.getCapital (test.ts6).eq (chargeFee (test.capital, test.ts6 - test.ts4)));

        assert (
            'web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether")));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdrawAll.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.ts7 = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockNumber).timestamp;
        test.oldCapital = chargeFee (test.capital, test.ts6 - test.ts4);
        test.capital = chargeFee (test.capital, test.ts7 - test.ts4);

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
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 0',
          withdrawalEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital)',
            web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital));

        assert (
            'test.custodialWrapper.getCapital (test.ts7).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts7).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether")));
      }},
    { name: "Alice tells Bob to accept payments",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.setAcceptsPayments (
            true,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Bob withdraws all the capital",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital)',
            web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital));

        assert (
            'test.custodialWrapper.getCapital (test.ts7).eq (test.capital)',
            test.custodialWrapper.getCapital (test.ts7).eq (test.capital));

        assert (
            'web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether"))',
            web3.eth.getBalance (test.bob.address).eq (web3.toWei ("0.5", "ether")));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdrawAll.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.ts8 = web3.eth.getBlock (
            web3.eth.getTransactionReceipt (test.tx).blockNumber).timestamp;
        test.capital = chargeFee (test.capital, test.ts8 - test.ts7);

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

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 1',
          withdrawalEvents.length == 1);

        assert (
          'withdrawalEvents [0].args.value.eq (test.capital)',
          withdrawalEvents [0].args.value.eq (test.capital));

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital)));

        assert (
            'test.custodialWrapper.getCapital (test.ts8) == 0',
            test.custodialWrapper.getCapital (test.ts8) == 0);

        assert (
            'web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether")))',
            web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether"))));
      }},
    { name: "Bob withdraws all the capital but client's capital is zero",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital)));

        assert (
            'test.custodialWrapper.getCapital (test.ts7) == 0',
            test.custodialWrapper.getCapital (test.ts7) == 0);

        assert (
            'web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether")))',
            web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether"))));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.withdrawAll.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded but no events were loged",
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

        var withdrawalEvents = test.custodialWrapper.Withdrawal (
            {},
            {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'withdrawalEvents.length == 0',
          withdrawalEvents.length == 0);

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital)));

        assert (
            'test.custodialWrapper.getCapital (test.ts7) == 0',
            test.custodialWrapper.getCapital (test.ts7) == 0);

        assert (
            'web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether")))',
            web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether"))));
      }},
    { name: "Bob tries to terminate smart contract but he is not the advisor of smart contract",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital)));

        assert (
            'test.custodialWrapper.getCapital (test.ts7) == 0',
            test.custodialWrapper.getCapital (test.ts7) == 0);

        assert (
            'web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether")))',
            web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether"))));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.terminate.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction was cancelled",
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

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital)));

        assert (
            'test.custodialWrapper.getCapital (test.ts7) == 0',
            test.custodialWrapper.getCapital (test.ts7) == 0);

        assert (
            'web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether")))',
            web3.eth.getBalance (test.bob.address).eq (test.capital.add (web3.toWei ("0.5", "ether"))));
      }},
    { name: "Carol terminates smart contact",
      body: function (test) {
        assert (
            'web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital))',
            web3.eth.getBalance (test.custodialWrapper.address).eq (test.oldCapital.sub (test.capital)));

        assert (
            'test.custodialWrapper.getCapital (test.ts7) == 0',
            test.custodialWrapper.getCapital (test.ts7) == 0);

        assert (
            'web3.eth.getCode (test.custodialWrapper.address).length > 2',
            web3.eth.getCode (test.custodialWrapper.address).length > 2)

        test.carolBalance = web3.eth.getBalance (test.carol.address);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
            test.custodialWrapper.address,
            test.custodialWrapper.terminate.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure smart contract was terminated",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.carol.Result (
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

        assert (
            'web3.eth.getBalance (test.custodialWrapper.address) == 0',
            web3.eth.getBalance (test.custodialWrapper.address) == 0);

        assert (
            'web3.eth.getCode (test.custodialWrapper.address).length <= 2',
            web3.eth.getCode (test.custodialWrapper.address).length <= 2)

        assert (
            'web3.eth.getBalance (test.carol.address).eq (test.carolBalance.add (test.oldCapital.sub (test.capital)))',
            web3.eth.getBalance (test.carol.address).eq (test.carolBalance.add (test.oldCapital.sub (test.capital))));
      }}
  ]});
