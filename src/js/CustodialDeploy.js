/*
 * Deployment script for Custodial Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

var year = 365.25 * 24 * 60 * 60;
var two128 = web3.toBigNumber ("0x100000000000000000000000000000000");
var two127 = web3.toBigNumber ("0x80000000000000000000000000000000");

function mul (a, b) {
  return a.mul (b).add (two127).divToInt (two128);
}

function pow (a, b) {
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

if (typeof annualFee != "number") throw "Annual fee is not a number";
if (annualFee < 0) throw "Annual fee < 0.00%";
if (annualFee > 10000) throw "Annual fee > 100.00%";

var annualFeeFactor = two128.mul (10000 - annualFee).divToInt (10000);

console.log ("Calculating fee factor");

var lower = annualFeeFactor;
var upper = two128;

while (upper.sub (lower).gt (1)) {
  var middle = upper.add (lower).div (2).round ();

  var compound = pow (middle, year);

  if (compound.lt (annualFeeFactor)) lower = middle;
  else if (compound.gt (annualFeeFactor)) upper = middle;
  else {
    lower = middle;
    upper = middle;
  }
  console.log ("==>" + upper.sub (lower).toFixed () + "<==");
}

var feeFactor = upper;

console.log ("Fee factor is: " + feeFactor.toFixed() + " (" + feeFactor.div (two128).toPrecision () + ")");

if (!web3.eth.contract (@ABI@).new (
  client,
  advisor,
  feeFactor,
  {from: web3.eth.accounts[0], data: "0x@BIN@", gas: 2000000},
  function (e, r) {
    if (e) throw e;
    if (typeof r.address !== "undefined") {
      console.log (
        "Deployed at " + r.address + " (tx: " + r.transactionHash + ")");
    }
  }).transactionHash) {
  console.log ("Deployment failed.  Probably web3.eth.accounts[0] is locked.");
}
