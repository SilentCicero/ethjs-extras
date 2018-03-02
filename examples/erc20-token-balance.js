const BN = require('bn.js')
const { call, } = require('../')
const HttpProvider = require('ethjs-provider-http')

async function run () {
  const tokenHolderAddress = '0xa0a3bb4d3034d9e58ee8706a61bb99f6a8b38c1e'

  // token contract address on Rinkeby
  const tokenContractAddress = '0x7295bb8709ec1c22b758a8119a4214ffed016323'
  const url = 'https://rinkeby.infura.io'
  const provider = new HttpProvider(url)

  const p1 = call({
    provider,
    address: tokenContractAddress,
    solidity: 'decimals():(uint8)',
    args: [],
  })

  const p2 = call({
    provider,
    address: tokenContractAddress,
    solidity: 'balanceOf(address):(uint256)',
    args: [tokenHolderAddress],
  })

  const p3 = call({
    provider,
    address: tokenContractAddress,
    solidity: 'symbol():(string)',
    args: [],
  })

  // Wait for both promises to resolve (or fail)
  const [r1, r2, r3] = await Promise.all([p1, p2, p3])

  const decimals = r1['0']
  const balance = r2['0']
  const tokenSymbol = r3['0'].replace(/[^\w]/g, '') // sanitize name

  console.log(`Network: ${url}`)
  console.log(`Token: '${tokenSymbol}' at ${tokenContractAddress} `)
  console.log(`Token balance of ${tokenHolderAddress} = ${balance} / 10^${decimals} = ${ intToDecimal(balance, decimals, {commify: true, pad: true}) }`)
}

run()
  .then(() => console.log("Done."))
  .catch(console.error)


function intToDecimal(weiInput, baseLength, optionsInput) {
  const stripHexPrefix = val => typeof val === 'string' && val.indexOf('0x') === 0 ? val.slice(2) : val
  const hexPrefix = val => val ? (`0x${stripHexPrefix((val || {}).div ? val.toString(16) : val)}`) : val
  const hexToBN = val => (val || {}).div ? val : new BN(stripHexPrefix(hexPrefix(val)), 16)
  const numToBN = val => (val || {}).div || String(val).indexOf('0x') !== -1 ? hexToBN(val) : new BN(val, 10)

  let wei = numToBN(weiInput)
  let negative = wei.lt(new BN(0))
  const base = (new BN(10, 10)).pow(numToBN(baseLength))
  const options = optionsInput || {}

  if (negative) {
    wei = wei.mul(new BN(-1))
  }

  let fraction = wei.mod(base).toString(10)

  while (fraction.length < baseLength) {
    fraction = `0${fraction}`
  }

  if (!options.pad) {
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1]
  }

  let whole = wei.div(base).toString(10)

  if (options.commify) {
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  let value = `${whole}${fraction === '0' ? '' : `.${fraction}`}`

  if (negative) {
    value = `-${value}`
  }

  return value
}
