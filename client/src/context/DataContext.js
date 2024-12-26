import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAllRollupsData, fetchRollupDetails, fetchTotalStats } from '../queries';
import { getAvailPrice } from '../api/price';
import { ROLLUPS_CONFIG } from '../config/rollups';

const DataContext = createContext();

export const useDataContext = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [availPrice, setAvailPrice] = useState(0);
  const [cachedData, setCachedData] = useState({
    mainnet: { rollups: [], stats: {}, globalStats: {} },
    testnet: { rollups: [], stats: {}, globalStats: {} }
  });

  // Function to update data without triggering loading state
  const updateDataSilently = useCallback(async () => {
    try {
      // Update price
      const price = await getAvailPrice();
      if (price !== null) {
        setAvailPrice(price);
      }

      // Update network data for both networks
      const [mainnetData, testnetData] = await Promise.all([
        fetchAllRollupsData('mainnet'),
        fetchAllRollupsData('testnet')
      ]);

      // Fetch global stats for each network
      const [mainnetGlobalStats, testnetGlobalStats] = await Promise.all([
        fetchTotalStats('mainnet'),
        fetchTotalStats('testnet')
      ]);

      console.log('Fetched global stats:', {
        mainnet: mainnetGlobalStats,
        testnet: testnetGlobalStats
      });

      // Fetch stats for each network's rollups
      const mainnetStatsPromises = ROLLUPS_CONFIG.mainnet.map(rollup => 
        fetchTotalStats('mainnet', rollup.appId)
      );
      const testnetStatsPromises = ROLLUPS_CONFIG.testnet.map(rollup => 
        fetchTotalStats('testnet', rollup.appId)
      );

      const [mainnetStats, testnetStats] = await Promise.all([
        Promise.all(mainnetStatsPromises),
        Promise.all(testnetStatsPromises)
      ]);

      // Create stats maps
      const mainnetStatsMap = {};
      const testnetStatsMap = {};

      ROLLUPS_CONFIG.mainnet.forEach((rollup, index) => {
        mainnetStatsMap[rollup.appId] = mainnetStats[index];
      });

      ROLLUPS_CONFIG.testnet.forEach((rollup, index) => {
        testnetStatsMap[rollup.appId] = testnetStats[index];
      });

      // Update state without triggering loading
      setCachedData(prev => ({
        mainnet: {
          rollups: mainnetData || prev.mainnet.rollups,
          stats: mainnetStatsMap,
          globalStats: mainnetGlobalStats
        },
        testnet: {
          rollups: testnetData || prev.testnet.rollups,
          stats: testnetStatsMap,
          globalStats: testnetGlobalStats
        }
      }));
    } catch (error) {
      console.error('Error updating data:', error);
      // Silently handle errors in background updates
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await updateDataSilently();
      setLoading(false);
    };

    loadInitialData();
  }, [updateDataSilently]);

  // Background updates
  useEffect(() => {
    // Initial delay before starting background updates
    const initialDelay = setTimeout(() => {
      // Set up recurring updates
      const intervalId = setInterval(updateDataSilently, 60000); // Update every minute
      
      // Cleanup function
      return () => {
        clearInterval(intervalId);
      };
    }, 60000); // Start after 1 minute

    // Cleanup initial delay
    return () => clearTimeout(initialDelay);
  }, [updateDataSilently]);

  const getRollupDetails = useCallback(async (network, appId, address, page = 1) => {
    try {
      return await fetchRollupDetails(network, appId, address, page);
    } catch (error) {
      return null;
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        loading,
        availPrice,
        cachedData,
        getRollupDetails
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
