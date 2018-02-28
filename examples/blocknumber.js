const { Eth, hexToBN } = require('../');

async function run (networkName = 'mainnet') {
  const asHex = await Eth({ network: networkName }).raw('eth_blockNumber')
  const asNumber = hexToBN(asHex).toString(10)
  console.log(`Block number: ${asNumber}`)
}

run(process.argv[2])
  .then(() => console.log('Done.'))
  .catch(console.log);
