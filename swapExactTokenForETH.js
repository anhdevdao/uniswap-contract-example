const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;

// PLEASE DO NOT RE-USE IN ANYWHERE!!!
const privateKey = Buffer.from('d8d07eb0669bce2965c3bec05fc5d3c7ab998bdc7acd69cc6690d78640cf1439', 'hex');

// Sotatek RINKEBY (testnet) Fullnode URL, can replace with Mainnet URL or another testnet URL
const URL = 'https://rinkeby-rpc.sotatek.com';

// Uniswap Router ABI
const { abi } = require('./abis/abi.json');

// ERC-20 ABI
const erc20ABI = require('./abis/ERC20.json').abi;

// Uniswap Address on RINKEBY
const contractAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

// VCL token's address (an ERC-20 token)
const tokenAddress = '0x8C19ec480624adE5dc62488d96D16B02455c94e0';

// WETH address
const WETH = '0xc778417e063141139fce010982780140aa0cd5ab';

const web3 = new Web3(URL);

const contract = new web3.eth.Contract(abi, contractAddress);
const vclToken = new web3.eth.Contract(erc20ABI, tokenAddress);

async function main() {
  /*
   *  Basic swap ERC-20 for as much ETH as possible flow
   */

  const trader = '0x1BaB8030249382A887F967FcAa7FE0be7B390728';

  // 1. Approve
  const decimals = await vclToken.methods.decimals().call();
  const amountIn = (5 * 10 ** decimals).toString();

  const approveData = vclToken.methods.approve(
    contractAddress,
    amountIn
  );

  const approveTxParams = {
    nonce: web3.utils.toHex(await web3.eth.getTransactionCount(trader)),
    gasLimit: web3.utils.toHex(await approveData.estimateGas({ from: trader })),
    gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
    to: tokenAddress,
    data: approveData.encodeABI(),
    value: '0x00' // 0
  }

  // sign and send =>>>
  // const tx = new Tx(approveTxParams, { chain: 'rinkeby' });
  // tx.sign(privateKey)
  // const serializeTx = tx.serialize();

  // await sendTransaction(serializeTx);

  // 2. Swap
  const path = [tokenAddress, WETH];
  const amountOutMin = '0';

  const swapData = contract.methods.swapExactTokensForETH(
    amountIn,
    amountOutMin,
    path,
    trader,
    Date.now() + 1000
  );

  const swapParams = {
    nonce: web3.utils.toHex(await web3.eth.getTransactionCount(trader)),
    gasLimit: web3.utils.toHex(await swapData.estimateGas({ from: trader })),
    gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
    to: contractAddress,
    data: swapData.encodeABI(),
    value: '0x00' // 0
  }

  const tx = new Tx(swapParams, { chain: 'rinkeby' });
  tx.sign(privateKey)
  const serializeTx = tx.serialize();

  await sendTransaction(serializeTx);
}

async function sendTransaction(serializeTx) {
  await web3.eth.sendSignedTransaction('0x' + serializeTx.toString('hex'), function(err, hash) {
    if (!err) {
      console.log(hash); // "0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385"
    } else {
      console.log(err)
    }
  });
}

main();
