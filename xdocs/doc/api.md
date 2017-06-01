# Custodial Smart Contract: API

This document describes the public API of the Custodial Smart Contract.

## 1. Constructor

### Signature

    function Custodial (address _client, address _advisor, uint256 _feeFactor)

### Description

Deploy new instance of Custodial Smart Contract with given client address (_client), advisor address (_advisor) and fee factor (_feeFactor).
Fee factor is passed as fixed-point number with 128 fractional bits.
In other words one should multiply fee factor by 2^128 and convert to 256-bit integer before passing it to this constructor.
Does not accept ether.

### Use Cases

* Deploy

## 2. Methods

### 2.1. getCapital(uint256)

#### Signature

    function getCapital (uint256 _currentTimestamp) constant
    returns (uint256)

#### Description

Return current value of client's capital (in Wei).
Current timestamp in seconds since epoch should be passed to this method because constant functions do not have access to current time.
May be called by anybody.
Does not accept ether.

#### Use Cases

* Get Capital

### 2.2. deposit()

#### Signature

    function deposit () payable

#### Description

Deposit ether sent within a call and add it to the client's capital.
May be called by anybody.

#### Use Cases

* Deposit

### 2.3. withdraw(uint256)

#### Signature

    function withdraw (uint256 _value)
    returns (bool _success)

#### Description

Withdraw _value from client's capital and send it to client.
Returns true if withdrawal was successful, false otherwise.
May be called only by client.
Does not accept ether.

#### Use Cases

* Withdraw

### 2.4. withdrawAll()

#### Signature

    function withdrawAll ()
    returns (bool _success)

#### Description

Withdraw all ether from client's capital and send it to client.
Returns true if withdrawal was successful, false otherwise.
May be called only by client.
Does not accept ether.

#### Use Cases

* Withdraw All

### 2.5. withdrawFee()

#### Signature

    function withdrawFee ()
    returns (boolean _success)

#### Description

Withdraw all ether that exceeds client's capital from the balance of the smart contract and send it to advisor.
Returns true if withdrawal was successful, false otherwise.
May be called only by advisor.
Does not accept ether.

#### Use Cases

* Withdraw Fee

### 2.6. terminate()

#### Signature

    function terminate ()

#### Description

Terminate smart contract and send all ether from its balance to advisor.
May be called only by advisor.
May be called only when client's capital is zero.
Does not accept ether.

#### Use Cases

* Terminate

## 3. Events

### 3.1. Deposit(address indexed, uint256)

#### Signature

    event Deposit (address indexed from, uint256 value)

#### Description

Logged when *value* ether was deposited and added to client's capital by the owner of address *from*.

#### Use Cases

* Deposit

### 3.2. Withdrawal(uint256)

#### Signature

    event Withdrawal (uint256 value)

#### Description

Logged with *value* ether was withdrawn from client's capital and sent to client.

#### Use Cases

* Withdraw
* Withdraw All


----
Copyright © 2017 by ABDK Consulting.

**Author:** Mikhail Vladimirov <mikhail.vladimirov@gmail.com\>
