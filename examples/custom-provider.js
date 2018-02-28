const { Eth, hexToBN } = require('../');
const HttpProvider = require('ethjs-provider-http');

async function run () {
  const url = 'http://127.0.0.1:7545'
  const eth = Eth({
    provider: new HttpProvider(url),
  })
  const asHex = await eth.raw('eth_blockNumber')
  const asNumber = hexToBN(asHex).toString(10)
  console.log(`Block number from '${url}': ${asNumber}`)
}

run()
  .then(() => console.log('Done.'))
  .catch(console.log);
