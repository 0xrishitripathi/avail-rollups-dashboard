const { initialize, getDecimals } = require("avail-js-sdk");
const { formatBalance } = require("@polkadot/util");
const BN = require("bn.js");

const sizeToBytes = (sizeString) => {
  const size = parseFloat(sizeString);
  const unit = sizeString.slice(-2).toUpperCase();
  
  switch (unit) {
    case 'KB': return size * 1024;
    case 'MB': return size * 1024 * 1024;
    case 'GB': return size * 1024 * 1024 * 1024;
    default: return size; // Assume bytes if no unit specified
  }
};

const formatAvail = (balance, decimals) => {
  const factor = new BN(10).pow(new BN(decimals));
  const whole = balance.div(factor);
  const fraction = balance.mod(factor);
  
  const fractionNumber = Number(fraction.toString()) / Number(factor.toString());
  const roundedFraction = fractionNumber.toFixed(2).slice(2);
  
  return `${whole.toString()}.${roundedFraction} AVAIL`;
};

const estimateFee = async (dataSize) => {
  const endpoint = "wss://turing-rpc.avail.so/ws";
  const api = await initialize(endpoint);

  const sender = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
  const decimals = getDecimals(api);

  const dataSizeBytes = sizeToBytes(dataSize);

  const maxPerTx = Number(api.consts.dataAvailability.maxAppDataLength.toString());
  const nbTransactions = Math.ceil(dataSizeBytes / maxPerTx);

  let estimatedFee;

  if (nbTransactions === 1) {
    const cost = await api.tx.dataAvailability.submitData("x".repeat(dataSizeBytes)).paymentInfo(sender);
    estimatedFee = cost.partialFee;
  } else {
    const dataFirstTx = "x".repeat(maxPerTx);
    let dataLastTx = "x".repeat(dataSizeBytes % maxPerTx);
    if (dataLastTx.length === 0) dataLastTx = dataFirstTx;
    const txFirst = api.tx.dataAvailability.submitData(dataFirstTx);
    const txLast = api.tx.dataAvailability.submitData(dataLastTx);
    const costFirstTx = await txFirst.paymentInfo(sender);
    const costLastTx = await txLast.paymentInfo(sender);

    estimatedFee = costFirstTx.partialFee.mul(new BN(nbTransactions - 1)).add(costLastTx.partialFee);
  }

  return formatAvail(estimatedFee, decimals);
};

module.exports = { estimateFee };