import axios from 'axios';
import { ROLLUPS_CONFIG } from './config/rollups';

// GraphQL endpoint configuration
const getGraphQLEndpoint = (network) => {
  return network === 'testnet' 
    ? 'https://turing-indexer.avail.so/'
    : 'https://indexer.avail.so/';
};

// Convert bytes to human readable format with better precision for large numbers
const formatBytes = (bytes) => {
  if (!bytes || bytes === "0") return '0 Bytes';
  
  // Parse the input as a number, handling string inputs
  const bytesNum = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(bytesNum)) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  // Handle very large numbers
  if (bytesNum === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytesNum) / Math.log(k));
  
  // Use more decimal places for larger units
  const decimals = i > 0 ? 2 : 0;
  const formatted = parseFloat((bytesNum / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[Math.min(i, sizes.length - 1)];
  
  console.log('Formatting bytes:', {
    input: bytes,
    parsed: bytesNum,
    formatted
  });
  
  return formatted;
};

// Format AVAIL amount with appropriate precision
const formatAvail = (amount) => {
  if (!amount) return '0 AVAIL';
  
  // Parse the input as a number, handling string inputs
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '0 AVAIL';
  
  // Always use 2 decimal places for consistency
  return `${value.toFixed(2)} AVAIL`;
};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

const getCacheKey = (network, appId, address) => `${network}-${appId}-${address}`;

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Fetch blob data for a specific rollup
export const fetchRollupBlobData = async (network, appId, address) => {
  const cacheKey = getCacheKey(network, appId, address);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const graphqlEndpoint = getGraphQLEndpoint(network);
  const numericAppId = parseInt(appId);
  
  const queryData = {
    query: `{ dataSubmissions(filter: { appId: { equalTo: ${numericAppId} }, signer: { equalTo: "${address}" } }) { totalCount aggregates { sum { fees byteSize } } } }`
  };

  try {
    const response = await axios.post(graphqlEndpoint, queryData);
    if (response.data.errors) return "0 Bytes";

    const data = response.data.data.dataSubmissions;
    if (!data?.aggregates?.sum?.byteSize) return "0 Bytes";

    const byteSize = data.aggregates.sum.byteSize.toString();
    const formattedSize = formatBytes(parseInt(byteSize, 10));
    
    setCachedData(cacheKey, formattedSize);
    return formattedSize;
  } catch (error) {
    return "0 Bytes";
  }
};

// Fetch total stats with caching
export const fetchTotalStats = async (network, appId = null) => {
  console.log('Fetching total stats for:', { network, appId });
  
  const cacheKey = appId ? `total-stats-${network}-${appId}` : `total-stats-${network}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('Returning cached data:', cached);
    return cached;
  }

  const graphqlEndpoint = getGraphQLEndpoint(network);
  const query = `{
    dataSubmissions${appId ? `(filter: { appId: { equalTo: ${appId} } })` : ''} {
      totalCount
      aggregates {
        distinctCount {
          id
        }
        sum {
          byteSize
          fees
        }
      }
    }
  }`;

  try {
    console.log('Making GraphQL request to:', graphqlEndpoint);
    console.log('Query:', query);
    
    const response = await axios.post(graphqlEndpoint, { query });
    console.log('Raw GraphQL response:', response.data);
    
    const stats = response.data.data.dataSubmissions;
    console.log('Parsed stats:', stats);
    
    // Handle large numbers properly
    const byteSize = stats.aggregates.sum.byteSize ? stats.aggregates.sum.byteSize.toString() : "0";
    const fees = stats.aggregates.sum.fees || 0;
    
    console.log('Processing values:', {
      byteSize,
      fees,
      distinctCount: stats.aggregates.distinctCount.id
    });
    
    const result = {
      totalSubmissions: parseInt(stats.aggregates.distinctCount.id) || 0,
      totalSize: formatBytes(byteSize),
      totalCost: formatAvail(fees)
    };

    console.log('Final formatted result:', result);
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching total stats:', error);
    return {
      totalSubmissions: 0,
      totalSize: '0 B',
      totalCost: '0 AVAIL'
    };
  }
};

// Fetch data for all configured rollups in a network
export const fetchAllRollupsData = async (network) => {
  const rollups = ROLLUPS_CONFIG[network];
  const results = [];

  for (const rollup of rollups) {
    try {
      const blobSize = await fetchRollupBlobData(network, rollup.appId, rollup.address);
      results.push({
        ...rollup,
        blobsSubmitted: blobSize
      });
    } catch (error) {
      results.push({
        ...rollup,
        blobsSubmitted: '0 Bytes'
      });
    }
  }

  return results;
};

// Fetch data for a specific appID/Rollup
export const fetchRollupData = async (network, appId = null) => {
  const graphqlEndpoint = getGraphQLEndpoint(network);
  
  // Base query to fetch all rollups if no appId is provided
  let query = `
    query {
      rollups {
        id
        name
        appId
        totalBlocks
        totalTransactions
        lastBlockTime
      }
    }
  `;

  // If appId is provided, modify query to fetch specific rollup
  if (appId) {
    query = `
      query {
        rollups(where: { appId: "${appId}" }) {
          id
          name
          appId
          totalBlocks
          totalTransactions
          lastBlockTime
        }
      }
    `;
  }

  try {
    const response = await axios.post(graphqlEndpoint, { query });
    return response.data.data.rollups;
  } catch (error) {
    throw error;
  }
};

const ROLLUP_DETAILS_QUERY = `
  query GetRollupDetails($appId: Int!, $address: String!, $first: Int!, $offset: Int!) {
    dataSubmissions(
      filter: {
        appId: { equalTo: $appId }
        signer: { equalTo: $address }
      }
      orderBy: TIMESTAMP_DESC
      first: $first
      offset: $offset
    ) {
      nodes {
        extrinsicId
        byteSize
        timestamp
      }
      totalCount
    }
    
    extrinsics(
      filter: {
        module: { equalTo: "dataAvailability" }
        call: { equalTo: "submitData" }
        signer: { equalTo: $address }
      }
      orderBy: TIMESTAMP_DESC
      first: $first
      offset: $offset
    ) {
      nodes {
        txHash
        timestamp
        block {
          number
        }
      }
      totalCount
    }
  }
`;

export const fetchRollupDetails = async (network, appId, address, page = 1, pageSize = 10) => {
  const endpoint = network === 'testnet' 
    ? 'https://turing-indexer.avail.so/'
    : 'https://indexer.avail.so/';

  try {
    const offset = (page - 1) * pageSize;
    const response = await axios.post(endpoint, {
      query: ROLLUP_DETAILS_QUERY,
      variables: {
        appId: parseInt(appId),
        address,
        first: pageSize,
        offset
      }
    });

    const { dataSubmissions, extrinsics } = response.data.data;

    // Combine data from both queries using timestamp as key
    const combinedData = dataSubmissions.nodes.map(submission => {
      const matchingExtrinsic = extrinsics.nodes.find(
        extrinsic => extrinsic.timestamp === submission.timestamp
      );
      
      return {
        appId,
        block: matchingExtrinsic?.block.number,
        txHash: matchingExtrinsic?.txHash,
        blobSize: submission.byteSize,
        timestamp: submission.timestamp
      };
    });

    return {
      data: combinedData,
      totalCount: dataSubmissions.totalCount
    };
  } catch (error) {
    console.error('Error fetching rollup details:', error);
    throw error;
  }
};
