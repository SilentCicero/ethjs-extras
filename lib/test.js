// yes
const test = require('tape-async');
const {
  Eth,
  EthContract,
  onAccount,
  onReceipt,
  onBlock,
  ethCall
} = require('./index.js');

test("basic tests", async t => {
  const simpleStore = new EthContract({
    network: 'rinkeby',
    address: '0x01a528451419d562a6752318a6fb71898fa5d840',
    methods: ['SimpleStore(address _master)', 'set()', 'set2()', 'Set(uint256 _value)', 'Set2(uint256 _value, address indexed _sender)', 'master():(address)', 'get():(uint256)']
  });

  const currentBlock = await Eth({ network: 'ropsten' }).raw('eth_blockNumber');
  const decodedLogs = await simpleStore.getLogs({ fromBlock: 0, toBlock: 'latest' });
  const masterAddress = await simpleStore.master();
  const getNum = await simpleStore.get();

  t.equal(String(currentBlock).indexOf('0x'), 0);
  t.equal(masterAddress[0], '0xEd64072ae4933CfeCc8965ecE0a22461A8F4256b');
  t.equal(getNum[0].toString(10), '45');

  // make a raw method call to a rpc network
  new Eth({ network: 'rinkeby' }).raw('eth_blockNumber').then(console.log).catch(console.log);

  // setup a light contract object, use solidity spec and or abi spec.
  const simpleStore2 = new EthContract({
    network: 'rinkeby',
    address: '0x01a528451419d562a6752318a6fb71898fa5d840',
    methods: ['SimpleStore(address _master)', 'set()', 'Set(uint256 _value)', 'master():(address)', 'get():(uint256)']
  });

  // contract methods, promise only
  simpleStore2.get().then(console.log).catch(console.log);
  simpleStore2.master().then(console.log).catch(console.log);
  simpleStore2.getLogs({ fromBlock: 0 }).then(console.log).catch(console.log);

  // just call a single contract method
  ethCall({
    network: 'rinkeby',
    address: '0x01a528451419d562a6752318a6fb71898fa5d840',
    solidity: 'get():(uint256)',
    args: []
  }).then(console.log).catch(console.log);

  // fires when receipt is avaiable for transaction hash
  onReceipt('0x5005c4dddca407a46b4193379102228cbafc5fb48a269e973d85fd4c30704653', {
    network: 'mainnet'
  }).then(console.log).catch(console.log);

  const { call } = Eth({ network: 'rinkeby' });
  call({
    address: '0x01a528451419d562a6752318a6fb71898fa5d840',
    solidity: 'get():(uint256)',
    args: []
  }).then(console.log).catch(console.log);
});