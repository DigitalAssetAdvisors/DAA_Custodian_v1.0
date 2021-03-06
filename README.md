# Custodial Smart Contract #

The DAA Custodial smart contract holds ETH funds on the client's behalf.  The smart contract calculates and  
administers the management fee payable to the advisor. 

## Directory ##
Solidity Source Code: https://github.com/DigitalAssetAdvisors/DAA_Custodian_v1.0/blob/master/src/sol/Custodial.sol

Functional Requirements: https://github.com/DigitalAssetAdvisors/DAA_Custodian_v1.0/blob/master/xdocs/doc/functional-requirements.md

API: https://github.com/DigitalAssetAdvisors/DAA_Custodian_v1.0/blob/master/xdocs/doc/api.md

## How to Build ##

In order to build Custodial Smart Contract you need the following software to
be properly installed on your system:

1. Oracle JRE 8+
2. Apache Ant 1.9.7+
3. Solidity 0.4.10+
4. Geth 1.5.9+

To build Custodial Smart Contract, do the following:

1. Checkout sources of Custodial Smart Contract
2. Go to the root folder of Custodial Smart Contract sources, i.e. to the folder
   containing this `README.md` file
3. Copy `build.properties.sample` file into `build.properties` and
   edit it as necessary
4. Run the following command: `ant build`
5. After successful build, `target` directory will contain compiled contract
   as well as ABI definition files

## How to Run Tests ##

After successful build you may want to run tests via `ant test` command.



---
**Author:** Mikhail Vladimirov <mikhail.vladimirov@gmail.com>

Copyright © 2017 by ABDK Consulting.
