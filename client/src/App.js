import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import logoImage from './logo.png';
import RollupDetails from './components/RollupDetails';
import { fetchAllRollupsData, fetchTotalStats } from './queries';
import axios from 'axios';
import { useDataContext } from './context/DataContext'; // Fixed import path

// Main container - adjust max-width to change overall app width
const AppContainer = styled.div`
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.8);
  min-height: 100vh;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    padding: 40px 15px;
  }
`;

const HeaderContainer = styled.div`
  margin-bottom: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 40px;
`;

// Logo container - adjust width and height to change logo size
const LogoContainer = styled.div`
  width: 100%;
  max-width: 400px;
  height: auto;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    max-width: 300px;
  }
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

// Stats container - adjust gap and max-width to change layout of stat boxes
const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  margin: 20px auto;
  flex-wrap: wrap;
  max-width: 800px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 0 16px;
    max-width: 100%;
  }
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  width: 240px;
  position: relative;
  height: 85px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
  }
`;

const StatLabel = styled.h2`
  font-size: 0.9em;
  color: #86868b;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StatValue = styled.p`
  font-size: 1.5em;
  font-weight: 700;
  color: #1d1d1f;
  margin: 10px 0;
`;

const USDPrice = styled.div`
  font-style: italic;
  color: #86868b;
  font-size: 0.75em;
  position: absolute;
  bottom: 8px;
  right: 12px;
  margin: 0;
`;

// Table container - adjust max-width to change table width
const TableContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow-x: auto;
  max-width: 1000px;
  margin: 0 auto;
  margin-top: 40px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 600px;
`;

const Th = styled.th`
  background-color: rgba(0, 0, 0, 0.03);
  color: #86868b;
  padding: 16px 12px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Td = styled.td`
  padding: 16px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  font-size: 0.9em;
  text-align: center;
  word-break: break-all;
  cursor: pointer;
`;

const Tr = styled(motion.tr)`
  &:last-child td {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
`;

const RollupName = styled.div`
  font-weight: 700;
  color: #1d1d1f;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

const ApproxText = styled.span`
  position: absolute;
  bottom: 5px;
  right: 10px;
  font-size: 0.6em;
  color: #86868b;
  font-style: italic;
`;

// Add these styled components after your existing styled components
const NetworkToggle = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
`;

const NetworkButton = styled.button`
  padding: 10px 20px;
  border-radius: 15px;
  border: 1px solid #1d1d1f;
  background: ${props => props.active ? '#1d1d1f' : 'transparent'};
  color: ${props => props.active ? 'white' : '#1d1d1f'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9em;
  
  &:hover {
    background: ${props => props.active ? '#1d1d1f' : 'rgba(29, 29, 31, 0.1)'};
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const PageLoadingOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const PageSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

const MainDashboard = ({ network, handleNetworkSwitch, stats, isLoading, error, rollups, availPrice }) => {
  const totalCostInAvail = parseFloat(stats?.totalCost?.replace(' AVAIL', '') || '0');
  const usdPrice = availPrice > 0 ? (totalCostInAvail * availPrice).toFixed(2) : null;

  return (
    <>
      <NetworkToggle>
        <NetworkButton 
          active={network === 'mainnet'}
          onClick={() => handleNetworkSwitch('mainnet')}
          disabled={isLoading}
        >
          Mainnet
        </NetworkButton>
        <NetworkButton 
          active={network === 'testnet'}
          onClick={() => handleNetworkSwitch('testnet')}
          disabled={isLoading}
        >
          Testnet
        </NetworkButton>
      </NetworkToggle>

      <StatsContainer>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatLabel>Total Blobs Size</StatLabel>
          <StatValue>{stats?.totalSize || '0 B'}</StatValue>
        </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatLabel>Total Blob Cost</StatLabel>
          <StatValue>{stats?.totalCost || '0 AVAIL'}</StatValue>
          {usdPrice && (
            <USDPrice>
              ≈ ${usdPrice}
            </USDPrice>
          )}
        </StatCard>
      </StatsContainer>

      <TableContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {error && (
          <div style={{ color: 'red', textAlign: 'center', margin: '20px 0' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Rollup</Th>
                <Th>AppID</Th>
                <Th>Address</Th>
                <Th>Blobs Submitted</Th>
              </tr>
            </thead>
            <tbody>
              {rollups.map((rollup, index) => (
                <Tr
                  key={rollup.appId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <Td>
                    <StyledLink 
                      to={`/rollup/${network}/${rollup.appId}`}
                      state={{ rollupData: rollup, network }}
                    >
                      <RollupName>{rollup.name}</RollupName>
                    </StyledLink>
                  </Td>
                  <Td>{rollup.appId}</Td>
                  <Td>{rollup.address}</Td>
                  <Td>{rollup.blobsSubmitted}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableContainer>
    </>
  );
};

const App = () => {
  const { loading, availPrice, cachedData } = useDataContext();
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to convert size string to bytes for comparison
  const sizeToBytes = (sizeStr) => {
    if (!sizeStr) return 0;
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    const matches = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/);
    if (!matches) return 0;
    const [, size, unit] = matches;
    return parseFloat(size) * units[unit];
  };

  const filteredRollups = useMemo(() => {
    const networkData = cachedData[selectedNetwork] || { rollups: [], stats: {} };
    if (!networkData?.rollups) return [];

    return networkData.rollups
      .filter(rollup => 
        rollup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rollup.appId.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const statsA = networkData.stats[a.appId] || { totalSize: '0 B' };
        const statsB = networkData.stats[b.appId] || { totalSize: '0 B' };
        return sizeToBytes(statsB.totalSize) - sizeToBytes(statsA.totalSize);
      });
  }, [selectedNetwork, searchQuery, cachedData]);

  const networkStats = useMemo(() => {
    const networkData = cachedData[selectedNetwork] || { stats: {} };
    
    // Get the global stats directly from the network data
    if (networkData.globalStats) {
      console.log('Using global stats for', selectedNetwork, networkData.globalStats);
      return networkData.globalStats;
    }
    
    // Fallback to calculating from individual stats
    const totalStats = {
      totalSize: '0 B',
      totalCost: '0 AVAIL',
      totalSubmissions: '0'
    };

    console.log('Calculating total stats for', selectedNetwork, 'from individual stats:', networkData.stats);

    Object.values(networkData.stats || {}).forEach(stats => {
      if (!stats) return;
      
      console.log('Processing stats:', stats);
      
      // Handle submissions
      totalStats.totalSubmissions = (
        parseInt(totalStats.totalSubmissions) + 
        parseInt(stats.totalSubmissions || 0)
      ).toString();
      
      // Handle size
      const currentBytes = sizeToBytes(totalStats.totalSize);
      const newBytes = sizeToBytes(stats.totalSize || '0 B');
      totalStats.totalSize = formatBytes(currentBytes + newBytes);
      
      // Handle cost
      const currentCost = parseFloat(totalStats.totalCost.replace(' AVAIL', ''));
      const newCost = parseFloat((stats.totalCost || '0 AVAIL').replace(' AVAIL', ''));
      totalStats.totalCost = (currentCost + newCost).toFixed(4) + ' AVAIL';
    });

    console.log('Calculated total stats:', totalStats);
    return totalStats;
  }, [selectedNetwork, cachedData]);

  if (loading) {
    return (
      <PageLoadingOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageSpinner />
      </PageLoadingOverlay>
    );
  }

  return (
    <Router>
      <AppContainer>
        <HeaderContainer>
          <LogoContainer>
            <LogoImage src={logoImage} alt="Rollups on Avail Logo" />
          </LogoContainer>
        </HeaderContainer>

        <Routes>
          <Route 
            path="/" 
            element={
              <MainDashboard 
                network={selectedNetwork}
                handleNetworkSwitch={setSelectedNetwork}
                stats={networkStats}
                isLoading={loading}
                error={null}
                rollups={filteredRollups}
                availPrice={availPrice}
              />
            } 
          />
          <Route path="/rollup/:network/:appId" element={<RollupDetails />} />
        </Routes>
      </AppContainer>
    </Router>
  );
};

const TableSkeleton = () => (
  <div style={{ opacity: 0.7 }}>
    {/* Add skeleton loading animation here */}
  </div>
);

const formatBytes = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

export default App;