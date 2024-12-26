import axios from 'axios';

let cachedPrice = null;
let lastFetched = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getAvailPrice = async () => {
  try {
    const now = Date.now();
    
    // Return cached price if valid
    if (cachedPrice && lastFetched && (now - lastFetched < CACHE_DURATION)) {
      return cachedPrice;
    }

    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'avail',
        vs_currencies: 'usd'
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data?.avail?.usd) {
      cachedPrice = response.data.avail.usd;
      lastFetched = now;
      return cachedPrice;
    }

    return null;
  } catch (error) {
    console.error('Error fetching price:', error);
    return cachedPrice; // Return last known price on error
  }
};
