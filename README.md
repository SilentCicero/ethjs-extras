## ethjs-extras

<br />

Nice lightweight extras for building dApps and focused Ethereum arch.

[Do not use in production... yet ;)]

## Install

```
npm install --save ethjs-extras
```

## Usage

```js
const {
  Eth,
  EthContract,
  onAccount,
  onReceipt,
  onBlock,
  call,
} = require('ethjs-extras'); // or import..

// make a raw method call to a rpc network
Eth({ network: 'rinkeby' }).raw('eth_blockNumber').then(console.log).catch(console.log);

// setup a light contract object, use solidity spec and or abi spec.
const simpleStore = new EthContract({
  network: 'rinkeby',
  address: '0x01a528451419d562a6752318a6fb71898fa5d840',
  methods: [
    'SimpleStore(address _master)',
    'set()',
    'Set(uint256 _value)',
    'master():(address)',
    'get():(uint256)',
  ],
});

// contract methods, promise only
simpleStore.get().then(console.log).catch(console.log); // using shorthand notation
simpleStore.master.call().then(console.log).catch(console.log); // using .call() notation
simpleStore.onEvent(console.log); // polls for events, receives, decodes and fires callback
simpleStore.getLogs({ fromBlock: 0 }).then(console.log).catch(console.log);

// send transaction notation .sendTransaction
// simpleStore.set.sendTransaction({ gas: 300000 }).then(console.log).catch(console.log);

// this fires when receipt is available for transaction hash
onReceipt('0x5005c4dddca407a46b4193379102228cbafc5fb48a269e973d85fd4c30704653', {
  network: 'mainnet',
})
.then(console.log).catch(console.log);

// just call a single contract method
call({
  network: 'rinkeby',
  address: '0x01a528451419d562a6752318a6fb71898fa5d840',
  solidity: 'get():(uint256)',
  args: [],
}).then(console.log).catch(console.log);

// get the balance
balanceOf('0x01a528451419d562a6752318a6fb71898fa5d840', { network: 'rinkeby' })
.then(console.log)
.catch(console.log);

// callback fires when accounts loaded from provider
onAccount(console.log, {
  provider: window.web3.currentProvider,
});

// callback fires when new block happens
onBlock(console.log, {
  network: 'ropsten',
});
```

## Contract Deployment

```js
const { Eth } = require('ethjs-extras');

// setup an Eth object
const { sendTransaction, onReceipt } = Eth({ provider: window.web3.currentProvider });

// or just use call with the constructor method.. hehe
sendTransaction({
  solidity: 'SimpleStore(address _master)',
  args: ['0x..SOME..ADDRESS..'],
  data: '0x..CONTRACT..DATA..',
  construct: true, // will create constructor sig.
})
.then(txHash => onReceipt(txHash))
.then(receipt => console.log(receipt.contractAddress))
.catch(console.log);

// once you have the address, you can setup a contract object, see first example..
```

## About

Experimental extras for EthJS.

## Philosophy

Simple. To the point. No bullshit. Virtually stateless objects and methods to interact with Ethereum.

## Promise / Callbacks

Promise only unless it's a callback that fires multiple times (i.e. `onBlock`, `onAccount`, `onEvent`)

## Polling => Websockets

We are currently using polling for the `receipts` / `logs`.. This will be `websockets` soon.

## Method Design

All methods can be used individually, or with defaults using the `Eth` object.

## ABI Encoding

Define in Solidity (thanks to solidity-to-abi), and `Ethers.js` does the rest ;)

## Solidity Types

Remember to define the full type for the solidity method inputs/ouputs (no shortcuts):

```
Bad:
uint

Good:
uint256

-----

Bad:
get():(uint)

Good:
get():(uint256)
```

## Eth Object

The Eth object is simply defining defaults which are being passed on to the methods...

```js
const { balanceOf, onAccount, contract, call } = Eth({ network: 'rinkeby' });
```

## Making Raw RPC Calls

You can make nice and raw RPC calls, but you have to do the hex decoding...

```js
const { Eth, hexToBN } = require('ethjs-extras');

Eth({ network: 'mainnet' }).raw('eth_blockNumber')
.then(blockAsHex => hexToBN(blockAsHex).toString(10)) // now.. BN object
.catch(console.log);
```

Raw method API:
`Eth(...).raw( RPC_METHOD_NAME_STRING, arg1, arg2, arg3 )`

We provide some helpers `val => result`..

Decoding Hex:
`hexToBN` : turn hex numbers into BN.js number object

Encoding Hex:
`hexPrefix` : hex prefix string data
`stripHexPrefix` : string hex prefix from string data (if any)
`hexNum` : always turn value (string / number / BN object) into hex string number

## Call Method Naming

The `call` and `ethCall` method are the same. Sometimes, function names like `call` are reserved depending on your linter. So we provide both for your convenience.

## Send Transaction

The `sendTransaction` method is simply the `call` method with the `method` defined as `sendTransaction`.

## Handling Ethereum Units

See `ethjs-unit` for handling unit conversion (eth => wei, USD => eth etc..)

## Network Determination

If 'network' specified: use infura at valid network (rinkeby, mainnet, ropsten)
If 'provider' specified: use provider object
If 'eth' specified: use eth object for sendAsync and method calls

## Exported methods

```
EthRPC,
onBlock,
onAccount,
onReceipt,
HttpProvider,
keccak256,
Eth,
balanceOf,
solToABI,
encodeParams,
decodeParams,
ethCall,
call,
EthContract,
encodeSignature,
encodeMethod,
decodeMethod,
logDecoder,
hexNum,
hexToBN,
hexPrefix,
stripHexPrefix,
BN,
raw,
sendTransaction,
empty,
solToABI,
numToBN,
```

## Contributing

Please help better the ecosystem by submitting issues and pull requests to `ethjs-format`. We need all the help we can get to build the absolute best linting standards and utilities. We follow the AirBNB linting standard and the unix philosophy.

## Help out

There is always a lot of work to do, and will have many rules to maintain. So please help out in any way that you can:

- Create, enhance, and debug ethjs rules (see our guide to ["Working on rules"](./github/CONTRIBUTING.md)).
- Improve documentation.
- Chime in on any open issue or pull request.
- Open new issues about your ideas for making `ethjs-format` better, and pull requests to show us how your idea works.
- Add new tests to *absolutely anything*.
- Create or contribute to ecosystem tools, like modules for encoding or contracts.
- Spread the word.

Please consult our [Code of Conduct](CODE_OF_CONDUCT.md) docs before helping out.

We communicate via [issues](https://github.com/ethjs/ethjs-extras/issues) and [pull requests](https://github.com/ethjs/ethjs-extras/pulls).

## Important documents

- [Changelog](CHANGELOG.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [License](https://raw.githubusercontent.com/ethjs/ethjs-extras/master/LICENSE)

## Licence

This project is licensed under the MIT license, Copyright (c) 2018 Nick Dodson. For more information see LICENSE.md.

```
The MIT License

Copyright (c) 2018 Nick Dodson. nickdodson.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
