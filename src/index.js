const EthRPC = require('ethjs-rpc');
const HttpProvider = require('ethjs-provider-http');
const keccak256 = require('js-sha3').keccak_256;
const { encodeParams, decodeParams } = require('ethers-contracts/interface');
const SolidityToABI = require('solidity-to-abi');
const BN = require('bn.js');
const stripHexPrefix = val => typeof val === 'string' && val.indexOf('0x') === 0 ? val.slice(2) : val;
const hexPrefix = val => val ? (`0x${stripHexPrefix(BN.isBN(val) ? val.toString(16) : val)}`) : val;
const hexToBN = val => new BN(stripHexPrefix(hexPrefix(val)), 16);
const numToBN = val => BN.isBN(val) || String(val).indexOf('0x') !== -1 ? hexToBN(val) : new BN(val, 10);
const solToABI = val => val ? ((typeof val === 'string') ? SolidityToABI(val) : val) : null;
const hexNum = val => hexPrefix(numToBN(val));
const blockPhraseOrNum = val => ['latest', 'pending', 'earliest'].includes(val) ? val : hexNum(val);
const empty = () => {};
const assign = Object.assign;
const names = arr => arr.map(v => v.name);
const types = arr => arr.map(v => v.type);
const intervalAndCall = (method, interval) => setInterval(method, interval || 3000, method());

// create an encoded method signature from an ABI object
function encodeSignature({ name, inputs }, eventSig = false) {
  const signatureData = `${name}(${inputs.map(v => v.type).join(',')})`;

  return `0x${''.slice.apply(keccak256(signatureData), (eventSig ? [0] : [0, 8]))}`;
}

// encode method ABI object with values in an array, output bytecode
function encodeMethod(method, values, construct) {
  const paramsEncoded = encodeParams(names(method.inputs), types(method.inputs), values);

  return `${construct ? '0x' : encodeSignature(method)}${paramsEncoded.substring(2)}`;
}

// decode method data bytecode, from method ABI object
function decodeMethod({ outputs }, data, arr = false) {
  const outputData = decodeParams(names(outputs), types(outputs), data);

  return arr ? outputData : outputs.reduce((acc, item, index) => assign(acc, {
    [index]: outputData[index],
  }, item.name ? { [item.name]: outputData[index] } : {}), {});
}

const EthObject = function (defaultOptions = {}) {
  const network = defaultOptions.network || 'ropsten';
  const httpProvider = defaultOptions.httpProvider || `https://${network}.infura.io`;
  const eth = defaultOptions.eth || (new EthRPC(defaultOptions.provider || (new HttpProvider(httpProvider))));
  if (!eth.raw) { eth.raw = (method, ...args) => eth.sendAsync({ method, params: args }); }
  return eth;
}

// just the raw method broken out in reverse ;)
const raw = (method, params = [], options = {}) => EthObject(options).raw(method, ...params);

// get the balance of an account
const balanceOf = (address, args = {}) => new Promise((resolve, reject) => EthObject(args)
  .raw('eth_getBalance', address, args.block || 'latest')
  .then(hex => resolve(hexToBN(hex)))
  .catch(error => reject(error)));

// listen for ethereum accounts
const onAccount = (listener, args = {}) => intervalAndCall(() => EthObject(args)
  .raw('eth_accounts')
  .then(acc => (acc.length ? listener(acc, null) : null))
  .catch(error => listener(null, error)), args.interval);

// listen for new block on network
const onBlock = (listener, args = {}, cblock) => intervalAndCall(() => EthObject(args)
    .raw('eth_blockNumber')
    .then(block => cblock !== block ? listener(hexToBN(cblock = block), null) : null)
    .catch(error => listener(null, error)), args.interval);

// listen for receipt of a transaction hash
const onReceipt = (txHash, args = {}) => new Promise((res, rej) => {
  const interval = onBlock(() => EthObject(args)
    .raw('eth_getTransactionReceipt', txHash)
    .then(receipt => (receipt || {}).transactionHash ? res(receipt, clearInterval(interval)) : '')
    .catch(error => rej(error, clearInterval(interval))));
});

// Decode a specific log item with a specific event abi
function decodeLogItem(eventABI, log) {
  if (!eventABI) return;

  // gather non indexed inputs
  const nonIndexed = eventABI.inputs.filter((input) => !input.indexed);

  // decode the event with nonindexed inputs
  const event = decodeParams(names(nonIndexed), types(nonIndexed), log.data);

  // decode each indexed input
  eventABI.inputs.filter(i => i.indexed).map((input, i) => {
    const topic = log.topics[i + (eventABI.anonymous ? 0 : 1)];
    const data = decodeParams([input.name], [input.type], topic).pop();
    event[input.name] = data;
  });

  // setup the event object data
  event._eventName = eventABI.name;
  event._eventLog = log;

  // return event
  return event;
}

// Create a decoder for all events defined in an abi. It returns a function which is called
// on an array of log entries such as received from getLogs or getTransactionReceipt and parses
// any matching log entries
const logDecoder = abi => {
  const eventMap = abi.reduce((acc = {}, item) => assign({}, acc, {
    [encodeSignature(item, true)]: item,
  }), {});

  // return log items
  return logItems => logItems.map(log => decodeLogItem(eventMap[log.topics[0]], log)).filter(i => i);
}

// low level call without provider setup
// FIXX this.
const ethCall = (options, method) => new Promise((resolve, reject) => {
  try {
    // setup options object
    const opts = assign({}, options, { ['abi']: solToABI(options.solidity) });

    // setup additional options from args args: [ ..., { from: .. }]
    const moreOpts = opts.args.length > ((opts.abi || {}).inputs || []).length ? opts.args.pop() : {};

    // more opts > opts
    const either = key => moreOpts[key] || opts[key];

    // encode method data
    const methodData = opts.abi ? encodeMethod(opts.abi, opts.args, either('construct')) : '';

    // setup eth object then send async method
    EthObject(opts).sendAsync({
      method: `eth_${method = (opts.method || 'call')}`,
      params: [{
        to: either('construct') ? undefined : (opts.to || opts.address),
        from: hexPrefix(either('from')),
        [options.gasLimit ? 'gasLimit' : 'gas']: hexNum(either('gas') || either('gasLimit')),
        gasPrice: hexNum(either('gasPrice') || '20000000000'),
        value: hexNum(either('value') || '0x0'),
        data: hexPrefix(`${stripHexPrefix(either('data')) || ''}${stripHexPrefix(methodData)}`),
      }].concat(method === 'call' ? [blockPhraseOrNum(either('block') || 'latest')] : []),
    }).then(value => {
      // try to decode if a call, otherwise return tx receipt hash
      try {
        resolve(method === 'call' ? decodeMethod(opts.abi, value, opts.returnArray) : value);
      } catch (error) { reject(error); }
    }).catch(reject);
  } catch (error) { reject(error); }
});

// eth contract
const EthContract = function(defaultOptions = {}, abi = [], decoder) {
  // setup eth object
  const eth = EthObject(defaultOptions);

  // setup call properties
  const callWithProps = (methodObj, method) => (...args) => ethCall({
    eth,
    from: defaultOptions.from,
    to: defaultOptions.address,
    method: method || 'call',
    solidity: methodObj.solidity,
    args,
    returnArray: defaultOptions.returnArray,
  });

  // biuld method constructor
  const methodContructor = method => {
    const result = callWithProps(method);
    result.call = callWithProps(method);
    result.sendTransaction = callWithProps(method, 'sendTransaction');
    return result;
  };

  // get logs
  const getLogs = (args = {}) => new Promise((resolve, reject) => eth.raw(
    'eth_getLogs',
    assign(args, {
      fromBlock: blockPhraseOrNum(args.fromBlock),
      toBlock: blockPhraseOrNum(args.toBlock),
      address: hexPrefix(defaultOptions.address),
      topics: args.topics || [],
    }))
  .then((logs, decoded = decoder(logs)) => resolve(decoded))
  .catch(reject));

  // setup onEvent method
  const onEventSetup = eventAbi => (listener, args = {}, cblock = '0') => onBlock(block => getLogs(assign({
    fromBlock: hexPrefix(args.fromBlock || hexToBN(cblock).add(hexToBN('1'))),
    toBlock: hexPrefix(args.toBlock || (cblock = block)),
  }, args))
  .then(logs => logs.length ? listener(logs, null) : '')
  .catch(error => listener(null, error)), { eth, interval: args.interval });

  // setup final frozen cotnract object with methods and helpers
  return Object.freeze(defaultOptions.methods
    .map((solidity, i) => ({ solidity, abi: solToABI(solidity) }))
    .map((obj, i) => assign(obj, { assign: (abi[i] = obj.abi) }))
    .reduce((acc, method) => assign(acc, {
      [method.abi.name]: methodContructor(method),
    }), { abi, logDecoder: (decoder = logDecoder(abi)), getLogs, onEvent: onEventSetup(abi) }));
}

// send transaction method broken out
const sendTransaction = (opts = {}) => ethCall(assign({ method: 'sendTransaction' }, opts));

// build eth object
const Eth = function (defaultOptions = {}) {
  const self = EthObject(defaultOptions);
  self.balanceOf = (addr, opts = {}) => balanceOf(addr, assign(defaultOptions, opts));
  self.onAccount = (listener, opts = {}) => onAccount(listener, assign(defaultOptions, opts));
  self.onBlock = (addr, opts = {}) => onBlock(addr, assign(defaultOptions, opts));
  self.onReceipt = (addr, opts = {}) => onReceipt(addr, assign(defaultOptions, opts));
  self.call = (opts = {}) => ethCall(assign(defaultOptions, opts));
  self.sendTransaction = (opts = {}) => sendTransaction(assign(defaultOptions, opts));
  self.contract = (opts = {}) => EthContract(assign(defaultOptions, opts));
  return self;
};

// export modules
module.exports = {
  EthRPC,
  onBlock,
  onAccount,
  onReceipt,
  HttpProvider,
  keccak256,
  Eth,
  raw,
  call: ethCall,
  sendTransaction,
  balanceOf,
  solToABI,
  encodeParams,
  decodeParams,
  ethCall,
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
  empty,
  solToABI,
  numToBN,
};
