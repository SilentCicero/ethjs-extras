const { Eth, hexToBN } = require('../');

async function eth_blockNumber (networkName = 'mainnet') {
  const asHex = await Eth({ network: networkName }).raw('eth_blockNumber')
  const asNumber = hexToBN(asHex).toString(10)
  console.log(`Block number: ${asNumber}`)
}

let networkName = process.argv[2] || 'mainnet'
console.log(`Calling eth_blockNumber on ${networkName}.`)

eth_blockNumber(networkName)
  .then(() => console.log('Done.'))
  .catch(console.log);
