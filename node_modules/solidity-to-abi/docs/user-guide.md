# User Guide

All information for developers using solidity-to-abi should consult this document.

## Install

```
npm install --save-dev solidity-to-abi
```

## Usage

```js
import solidityToABI from `solidity-to-abi`;

// parse solidity method string
const abi = solidityToABI('balanceOf(address _addr):(uint256 balance)');

console.log(abi);
/*
Object result:
{
  "name": "balanceOf",
  "type": "function",
  "constant": false,
  "inputs": [
    {
      "type": "address",
      "name": "_addr"
    }
  ],
  "outputs": [
    {
      "type": "uint256",
      "name": "balance"
    }
  ]
}
*/
```


## API Design

### constructor

[index.js:34-78](../../../blob/master/src/index.js#L29-L92 "Source code on GitHub")

Converts a Solidity method interface string into a web3 ABI object.

**Parameters**

-   `methodInterface` **String** the Solidity method interface string (i.e. `balanceOf(address _addr)`)

Returns **Object**, example:

```
{
  "name": "balanceOf",
  "type": "function",
  "constant": false,
  "inputs": [
    {
      "type": "address",
      "name": "_addr"
    }
  ],
  "outputs": [
    {
      "type": "uint256",
      "name": "balance"
    }
  ]
}
```

## Gotchas

 - No type checking for solidity input and output types
