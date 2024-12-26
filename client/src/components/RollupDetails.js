import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { fetchRollupDetails, fetchTotalStats } from '../queries';
import { ROLLUPS_CONFIG } from '../config/rollups';
import WebsiteIcon from './website.svg';
import GithubIcon from './github.svg';
import ExplorerIcon from './explorer.svg';
import { useDataContext } from '../context/DataContext';

const AppContainer = styled(motion.div)`
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.8);
  min-height: 100vh;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);

  @media (max-width: 768px) {
    padding: 40px 15px;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
`;

const RollupLogo = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin-bottom: 40px;
  object-fit: contain;
  background-color: white;
  padding: 4px;
  box-shadow: 4px 6px 12px rgba(0, 0, 0, 0.2);
  transform: perspective(1000px) rotateX(5deg);
  transition: transform 0.3s ease;

  &:hover {
    transform: perspective(1000px) rotateX(0deg);
  }
`;

const RollupName = styled.h1`
  font-size: 2em;
  color: #1d1d1f;
  margin: 0;
  margin-bottom: 20px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1.5em;
  }
`;

const RollupInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

const RollupAddress = styled.a`
  font-size: 1em;
  color: #86868b;
  margin-bottom: 20px;
  text-align: center;
  text-decoration: none;
  display: block;
  overflow-x: scroll;
  white-space: nowrap;
  padding: 4px 20px;
  width: calc(100% - 40px);
  margin-left: auto;
  margin-right: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    font-size: 0.85em;
    width: calc(100% - 40px);
  }
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */

  &:hover {
    text-decoration: underline;
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 32px;
  margin: 24px 0 48px 0;
`;

const IconLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #86868b;
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? '0.5' : '1'};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};

  img {
    width: 24px;
    height: 24px;
  }

  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    color: #1d1d1f;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  margin: 20px 0;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 0 16px;
  }
`;

const StatCard = styled.div`
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

const TableContainer = styled.div`
  overflow-x: auto;
  margin: 20px 0;
  margin-top: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 1000px; // Ensure table doesn't get too narrow
`;

const Th = styled.th`
  padding: 16px;
  text-align: center;
  background-color: #f5f5f7;
  color: #1d1d1f;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #eaeaea;
`;

const Td = styled.td`
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #eaeaea;
  color: #333;
  font-size: 14px;
  white-space: nowrap;

  &.hash-cell {
    max-width: none;
    white-space: nowrap;
  }
`;

const Tr = styled(motion.tr)`
  &:last-child td {
    border-bottom: none;
  }
`;

const BackLink = styled(Link)`
  display: inline-block;
  padding: 7px 10px;
  background-color: black;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #333;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

const PageButton = styled.button`
  background: ${props => props.active ? '#1d1d1f' : 'transparent'};
  color: ${props => props.active ? 'white' : '#1d1d1f'};
  border: 1px solid #1d1d1f;
  padding: 8px 12px;
  margin: 0 5px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: all 0.3s ease;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.9em;
  border-radius: 5px;

  &:hover {
    background: ${props => props.disabled ? 'transparent' : '#1d1d1f'};
    color: ${props => props.disabled ? '#1d1d1f' : 'white'};
  }
`;

const HashLink = styled.a`
  color: #007AFF;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const PageInfo = styled.span`
  margin: 0 10px;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.9em;
  color: #1d1d1f;
`;

const USDPrice = styled.span`
  font-size: 0.8em;
  color: #86868b;
  font-style: italic;
  position: absolute;
  bottom: 8px;
  right: 16px;
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

const formatBlobSize = (size) => {
  if (size === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const digitGroups = Math.floor(Math.log10(size) / Math.log10(1024));
  const value = size / Math.pow(1024, digitGroups);
  return `${value.toFixed(2)} ${units[digitGroups]}`;
};

const formatRelativeTime = (timestamp) => {
  try {
    // Ensure we're working with UTC timestamps
    const ensureUTC = (timeStr) => timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`;
    
    // Get current time in UTC
    const currentTimeUTC = new Date().toISOString();
    
    // Ensure transaction time is in UTC
    const transactionTimeUTC = ensureUTC(timestamp);

    // Create Date objects from UTC strings
    const currentTime = new Date(currentTimeUTC);
    const transactionTime = new Date(transactionTimeUTC);

    // Calculate difference using UTC timestamps
    const differenceInMs = currentTime.getTime() - transactionTime.getTime();
    const differenceInMinutes = Math.floor(differenceInMs / 60000);

    // Format the output based on the time difference
    if (differenceInMinutes < 1) {
      return 'Just now';
    } else if (differenceInMinutes < 60) {
      return `${differenceInMinutes} ${differenceInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      const hours = Math.floor(differenceInMinutes / 60);
      if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const days = Math.floor(hours / 24);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      }
    }
  } catch (error) {
    return 'Invalid date';
  }
};

const RollupDetails = () => {
  const { appId, network } = useParams();
  const { loading, availPrice, getRollupDetails, cachedData, isBackgroundUpdate } = useDataContext();
  const [isLoading, setIsLoading] = useState(true);
  const [rollupData, setRollupData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalSubmissions: '0',
    totalSize: '0 Bytes',
    totalCost: '0 AVAIL'
  });

  useEffect(() => {
    const loadRollupData = async () => {
      // Only show loading state on initial load or page change
      if (!isBackgroundUpdate) {
        setIsLoading(true);
      }
      
      try {
        const rollupConfig = ROLLUPS_CONFIG[network].find(r => r.appId === appId);
        
        if (rollupConfig) {
          setRollupData(rollupConfig);
          
          const networkStats = cachedData[network].stats;
          if (networkStats && networkStats[appId]) {
            setStats(networkStats[appId]);
          }

          const details = await getRollupDetails(network, appId, rollupConfig.address, currentPage);
          if (details) {
            // Only update table data if we're on the same page or it's initial load
            setTableData(prevData => {
              // If it's a background update and we have data, merge with existing data
              if (isBackgroundUpdate && prevData.length > 0) {
                const existingHashes = new Set(prevData.map(item => item.txHash));
                const newItems = details.data.filter(item => !existingHashes.has(item.txHash));
                if (newItems.length > 0) {
                  return [...newItems, ...prevData].slice(0, 10); // Keep only 10 items
                }
                return prevData;
              }
              return details.data;
            });
            setTotalPages(Math.ceil(details.totalCount / 10));
          }
        }
      } catch (error) {
        // Error will be handled by error boundary
      } finally {
        if (!isBackgroundUpdate) {
          setIsLoading(false);
        }
      }
    };

    loadRollupData();
  }, [network, appId, currentPage, getRollupDetails, cachedData, isBackgroundUpdate]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Only show loading spinner on initial load
  if (loading || (isLoading && !isBackgroundUpdate)) {
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

  const explorerUrl = `https://${network === 'mainnet' ? 'avail' : 'avail-turing'}.subscan.io`;

  return (
    <AppContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackLink to="/">← Back</BackLink>
      <HeaderContainer>
        {rollupData?.logo && rollupData.logo !== null && (
          <RollupLogo 
            src={rollupData.logo}
            alt={`${rollupData.name} logo`}
          />
        )}
        <RollupInfo>
          <RollupName>{rollupData?.name}</RollupName>
          <RollupAddress 
            href={`${explorerUrl}/account/${rollupData?.address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {rollupData?.address}
          </RollupAddress>
          <IconContainer>
            {rollupData?.website && (
              <IconLink href={rollupData.website} target="_blank" rel="noopener noreferrer">
                <img src={WebsiteIcon} alt="Website" />
              </IconLink>
            )}
            {rollupData?.github && (
              <IconLink href={rollupData.github} target="_blank" rel="noopener noreferrer">
                <img src={GithubIcon} alt="GitHub" />
              </IconLink>
            )}
            {rollupData?.explorer && (
              <IconLink href={rollupData.explorer} target="_blank" rel="noopener noreferrer">
                <img src={ExplorerIcon} alt="Explorer" />
              </IconLink>
            )}
          </IconContainer>
        </RollupInfo>
      </HeaderContainer>

      <StatsContainer>
        <StatCard>
          <StatValue>{stats.totalSubmissions}</StatValue>
          <StatLabel>Total DA Submissions</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.totalSize}</StatValue>
          <StatLabel>Total Blob Size</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.totalCost}</StatValue>
          <StatLabel>Total Cost</StatLabel>
          {availPrice > 0 && stats.totalCost && (
            <USDPrice>
              ≈ ${(parseFloat(stats.totalCost.replace(' AVAIL', '')) * availPrice).toFixed(2)}
            </USDPrice>
          )}
        </StatCard>
      </StatsContainer>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th>AppID</Th>
              <Th>Block</Th>
              <Th>Tx Hash</Th>
              <Th>Blob Size</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <AnimatePresence mode="wait">
            <motion.tbody
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {tableData.map((item, index) => (
                <Tr key={item.txHash || index}>
                  <Td>{item.appId}</Td>
                  <Td>
                    <HashLink
                      href={`${explorerUrl}/block/${item.block}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.block}
                    </HashLink>
                  </Td>
                  <Td className="hash-cell">
                    <HashLink
                      href={`${explorerUrl}/extrinsic/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.txHash}
                    </HashLink>
                  </Td>
                  <Td>{formatBlobSize(item.blobSize)}</Td>
                  <Td>{formatRelativeTime(item.timestamp)}</Td>
                </Tr>
              ))}
            </motion.tbody>
          </AnimatePresence>
        </Table>
      </TableContainer>

      <Pagination>
        <PageButton onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</PageButton>
        <PageButton onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>&lt;</PageButton>
        <PageInfo>Page {currentPage} of {totalPages}</PageInfo>
        <PageButton onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}>&gt;</PageButton>
        <PageButton onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</PageButton>
      </Pagination>
    </AppContainer>
  );
};

export default RollupDetails;
