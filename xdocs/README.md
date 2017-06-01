# Custodial Smart Contract #

This smart contract holds ETH funds on the client's behalf, calcualates and
admisiters the management fee on the advisor's behalf. 


## How to Deploy ##

In order to deploy Custodial Smart Contract you need the following software to
be properly installed on your system:

1. Geth 1.5.9+ (https://geth.ethereum.org/)

Also, you need Ethereum node running on your system and synchronized with the
network.  If you do not have one, you may run it via one of the following
commands depending on whether you want to connect to PRODNET or TESTNET:

    geth
    geth --testnet

If you are running Ethereum node for the first time, you may also add "--fast"
flag to speed up initial synchronization:

    geth --fast
    geth --testnet --fast

Also you need at least one account in your node.  If you do not have any
accounts, you may create one using the following commands:

    geth attach
    > personal.newAccount ();
    > exit

It will ask you to choose passphrase and enter it twice, and it will output an
address of your new created account.

You will also need some ether on your primary account.

In order to deploy Custodial Smart Contract do the following:

1. Go to the directory containing deployment script, i.e. file named
   `CustodialDeploy.js`.
2. Attach to your local Ethereum node: `geth attach`
3. Set Client address like this: `var client = "0xc3900D3141766f0803C3610B36e3861e602383Ce";`
4. Set Advisor address like this: `var advisor = "0x0c27EC3CD5B114C280A889777050be7beF4FEcBA";`
5. Set annual fee in hundredths of percent like this: `var annualFee = 150; // i.e. 1.5%;`
6. Unlock your primary account:
   `personal.unlockAccount (web3.eth.accounts [0]);` (you will be
   asked for your passphrase here)
7. Run deployment script: `loadScript ("CustodialDeploy.js");`
8. If everything will go fine, after several seconds you will see message like
   the following: `Deployed at ... (tx: ...)`,
   which means that your contract was deployed (message shows address of the
   contract and hash of the transaction the contract was deployed by)
   
   

----
**Author:** Mikhail Vladimirov <mikhail.vladimirov@gmail.com>

Copyright © 2017 by ABDK Consulting.

