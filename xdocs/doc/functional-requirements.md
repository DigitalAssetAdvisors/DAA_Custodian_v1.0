# Custodial Smart Contract: Functional Requirements

This document describes functional requirements for Custodial Smart Contract.



## 1. Introduction

Custodial Smart Contract is an Ethereum smart contract that represents an agreement between two sides known as "client" and "advisor".
The Custodial Smart Contract holds client's ether known as "client's capital" or simply "capital" and charges a management fee on behalf of the advisor.
Client's capital is continuously being decreased by the management fee according to the following formula: `capital (t + 1 second) = capital (t) * fee_factor`, where `fee_factor` is a non-negative number less than 1.0.
The assessed management fee belongs to advisor.

## 2. Use Cases

### 2.1. Deploy

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to deploy *Smart Contract* with certain client address, advisor address and fee factor.

#### Main Flow:

1. *User* deploys *Smart Contract* providing the following information as constructor parameters: client address, advisor address, and fee factor
2. Fee factor is less than or equal to 1.0
3. *Smart Contract* remembers client address, advisor address, and fee factor

#### Exceptional Flow 1:

1. Same as in Main Flow
2. Fee factor is greater than 1.0
3. *Smart Contract* cancels transaction

### 2.2. Get Capital

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to know current value of client's capital

#### Main Flow:

1. *User* calls constant method on *Smart Contract* providing the following information as method parameters: current time (constant method means method that does not modify blockchain state, so such method may be called consuming zero gas; constant methods do not have access to current time, so current time ought to be passed as method parameter)
2. *Smart Contract* calculates actual value of client's capital
3. *Smart Contract* returns calculated client's capital value to *User*

### 2.3. Deposit

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to deposit ether to *Smart Contract* and add it to client's capital

#### Main Flow:

1. *User* calls payable method on *Smart Contract* and sends ether within call (payable method means method that is able to accept ether once being called; starting from Solidity 0.4.1 smart contract methods are non-payable by default)
2. *User* actually sent some ether, i.e. value of ether sent by *User* is greater than zero
3. Value of ether sent by *User* plus current client's capital does not exceed maximum allowed value of client's capital (see Limits section below)
4. *Smart Contract* accepts ether sent by *User*
5. *Smart Contract* increases client's capital by the value of ether send by *User*
6. *Smart Contract* logs deposit event with the following information: address of *User*, value of ether sent by *User*

#### Exceptional Flow 1:

1. Same as in Main Flow
2. *User* actually sent no ether, i.e. value of ether sent by *User* is zero
3. *Smart Contract* does nothing

#### Exceptional Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Value of ether sent by *User* plus current client's capital exceeds maximum allowed value of client's capital
4. *Smart Contract* cancels transaction

### 2.4. Withdraw

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to withdraw certain amount of ether from client's capital

#### Main Flow:

1. *User* calls method on *Smart Contract* providing the following information as method arguments: amount of ether to withdraw
2. *User* is client of *Smart Contract*
3. *User* actually requested some ether to be withdrawn, i.e. requested amount of ether is greater than zero
4. Requested amount of ether is less than or equal to current client's capital
5. *Smart Contract* sends requested amount of ether to client
6. Send operation succeeded
7. *Smart Contract* decreases client's capital by the amount of ether withdrawn
8. *Smart Contract* logs withdrawal event with the following information: amount of ether withdrawn
9. *Smart Contract* returns success indicator to *User*

#### Exceptional Flow 1:

1. Same as in Main Flow
2. *User* is not client of *Smart Contract*
3. *Smart Contract* cancels transaction

#### Exceptional Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. *User* actually didn't not request any ether to be withdrawn, i.e. requested amount of ether is zero
4. *Smart Contract* returns success indicator to *User*

#### Exceptional Flow 3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Requested amount of ether is greater than current client's capital
5. *Smart Contract* returns error indicator to *User*

#### Exceptional Flow 4:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main flow
4. Same as in Main Flow
5. Same as in Main Flow
6. Send operation fails
7. *Smart Contract* returns error indicator to *User*

### 2.5. Withdraw All

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to withdraw the client's entire capital

#### Main Flow:

1. *User* calls method on *Smart Contract*
2. *User* is client of *Smart Contract*
3. Current client's capital value is greater than zero
4. *Smart Contract* sends the whole client's capital to client
5. Send operation succeeded
6. *Smart Contract* decreases client's capital to zero
7. *Smart Contract* logs withdrawal event with the following information: amount of ether withdrawn
8. *Smart Contract* returns success indicator to *User*

#### Exceptional Flow 1:

1. Same as in Main Flow
2. *User* is not client of *Smart Contract*
3. *Smart Contract* cancels transaction

#### Exceptional Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Current client's capital value is zero
4. *Smart Contract* returns success indicator to *User*

#### Exceptional Flow 3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Send operation failed
6. *Smart Contract* returns error indicator to *User*

### 2.6. Withdraw Fee

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to withdraw the accrued management fee as well as all unaccounted ether from *Smart Contract* (unaccounted ether is all ether that came to the balance of *Smart Contract* without executing any code of *Smart Contract*)

#### Main Flow:

1. *User* calls method on *Smart Contract*
2. *User* is advisor of *Smart Contract*
3. Balance of *Smart Contract* is greater than current client's capital
4. *Smart Contract* sends all balance that exceeds current client's capital to advisor
5. Send operation succeeds
6. *Smart Contract* returns success indicator to *User*

#### Exceptional Flow 1:

1. Same as in Main Flow
2. *User* is not advisor of *Smart Contract*
3. *Smart Contract* cancels transaction

#### Exceptions Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Balance of *Smart Contract* is not greater than current client's capital
4. *Smart Contract* returns success indicator to *User*

#### Exceptional Flow 3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Same as in Main Flow
5. Send operation fails
6. *Smart Contract* returns error indicator to *User*

### 2.7. Terminate

**Actors**: *User*, *Smart Contract*

**Goal**: *User* wants to terminate an agreement represented by *Smart Contract*

#### Main Flow:

1. *User* calls method on *Smart Contract*
2. *User* is advisor of *Smart Contract*
3. Current client's capital value is zero
4. Balance of *Smart Contract* is greater than zero
5. *Smart Contract* sends all its balance to advisor
6. *Smart Contract* ignores whether send operation succeeded or failed
7. *Smart Contract* suicides moving all its balance to the address of advisor

#### Exceptional Flow 1:

1. Same as in Main Flow
2. *User* is not advisor of *Smart Contract*
3. *Smart Contract* cancels transaction

#### Exceptional Flow 2:

1. Same as in Main Flow
2. Same as in Main Flow
3. Current client's capital is not zero
4. *Smart Contract* cancels transaction

#### Exceptional Flow 3:

1. Same as in Main Flow
2. Same as in Main Flow
3. Same as in Main Flow
4. Balance of *Smart Contract* is zero
5. *Smart Contract* suicides moving all its balance to the address of advisor

## 3. Limits

The following limits are established:

Limit                                  | Value
-------------------------------------- | -----------
Maximum allowed client's capital value | 2^128-1 Wei



----
**Author:** Mikhail Vladimirov <mikhail.vladimirov@gmail.com\>

Copyright © 2017 by ABDK Consulting.
