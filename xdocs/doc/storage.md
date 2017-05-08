# Custodial Smart Contract: Storage

This document describes storage structure of Custodial Smart Contract
Copyright © 2017 by ABDK Consulting.

**Author:** Mikhail Vladimirov <mikhail.vladimirov@gmail.com\>

## 1. Fields

### 1.1 client

#### Signature

    address client

#### Description

Address of the client of Custodial Smart Contract.  Only owner of this address
may withdraw from capital.

#### Used in Use Cases

* Withdraw
* Withdraw All

#### Modified in Use Cases

* Deploy

### 1.2. advisor

#### Signature

    address advisor

#### Description

Address of the advisor of Custodial Smart Contract.  Only owner of this address
may withdraw fee and terminate smart contract.

#### Used in Use Cases

* Withdraw Fee
* Terminate

#### Modified in Use Cases

* Deploy

### 1.3. capital

#### Signature

    uint256 capital

#### Description

Value of client's capital at some moment in the past.  It is guaranteed that
since that moment no deposits or withdrawals were made.

#### Used in Use Cases

* Get Capital
* Deposit
* Withdraw
* Withdraw All
* Withdraw Fee
* Terminate

#### Modified in Use Cases

* Deposit
* Withdraw
* Withdraw All

### 1.4. capitalTimestamp

#### Signature

    uint256 capitalTimestamp

#### Description

Time (in seconds since epoch) when value of capital field was last updated.  It
is guaranteed that there were no deposits of withdrawals since that time.

#### Used in Use Cases

* Get Capital
* Deposit
* Withdraw
* Withdraw All
* Withdraw Fee

#### Modified in Use Cases

* Deposit
* Withdraw
* Withdraw All

### 1.5. feeFactor

#### Signature

    uint256 feeFactor

#### Description

Factor used to charge fee.  Event second client's capital is reduced according
to the following formula:

    capital(t + 1 second) = capital(t)*feeFactor/2^128

#### Used in Use Cases

* Get Capital
* Deposit
* Withdraw
* Withdraw All
* Withdraw Fee

#### Modified in Use Cases

*Deploy
