import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sparkyAPI } from '../services/api';
import EnergyGraph from './EnergyGraph';
import './SparkyDetails.css';

const SparkyDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sparky, address, group } = location.state || {};
  
  const [sparkyData, setSparkyData] = useState({
    details: null,
    access: null,
    electricityLatest: null,
    electricityLatestP1: null,
    electricityFirst: null,
    electricity15min: null,
    gas15min: null,
    total15min: null,
  });
  
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  });
  
  const [loading, setLoading] = useState({
    details: false,
    access: false,
    electricityLatest: false,
    electricityLatestP1: false,
    electricityFirst: false,
    electricity15min: false,
    gas15min: false,
    total15min: false,
  });
  
  const [error, setError] = useState('');

  const fetchSparkyData = useCallback(async () => {
    if (!sparky?.serialNumber) {
      setError('No Sparky serial number available');
      return;
    }

    const serialNumber = sparky.serialNumber;
    
    // Fetch all Sparky data in parallel
    const fetchPromises = [
      fetchData('details', () => sparkyAPI.getSparkyDetails(serialNumber)),
      fetchData('access', () => sparkyAPI.getSparkyAccess(serialNumber)),
      fetchData('electricityLatest', () => sparkyAPI.getElectricityLatest(serialNumber)),
      fetchData('electricityLatestP1', () => sparkyAPI.getElectricityLatestP1(serialNumber)),
      fetchData('electricityFirst', () => sparkyAPI.getElectricityFirst(serialNumber)),
      fetchData('electricity15min', () => sparkyAPI.getElectricity15min(serialNumber, selectedDate)),
      fetchData('gas15min', () => sparkyAPI.getGas15min(serialNumber, selectedDate)),
      fetchData('total15min', () => sparkyAPI.getTotal15min(serialNumber, selectedDate)),
    ];

    await Promise.all(fetchPromises);
  }, [sparky?.serialNumber, selectedDate]);

  const fetchData = async (key, apiCall) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const data = await apiCall();
      console.log(`Sparky ${key} response:`, data);
      setSparkyData(prev => ({ ...prev, [key]: data }));
    } catch (err) {
      console.error(`Error fetching Sparky ${key}:`, err);
      // Don't set error for individual failures, just log them
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    if (sparky?.serialNumber) {
      fetchSparkyData();
    } else {
      setError('No Sparky information available');
    }
  }, [sparky?.serialNumber, fetchSparkyData]);

  const handleBackToDashboard = () => {
    // Use browser history to go back, which preserves the previous state
    navigate(-1);
  };

  const formatData = (data) => {
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  const renderDataSection = (title, data, loadingKey, dataKey) => {
    const isLoading = loading[loadingKey];
    const hasData = data !== null && data !== undefined;
    
    return (
      <div className="data-section">
        <h3>{title}</h3>
        {isLoading ? (
          <div className="loading">Loading {title.toLowerCase()}...</div>
        ) : hasData ? (
          <pre className="data-display">{formatData(data)}</pre>
        ) : (
          <div className="no-data">No {title.toLowerCase()} available</div>
        )}
      </div>
    );
  };

  if (!sparky) {
    return (
      <div className="sparky-details">
        <div className="error-state">
          <h2>No Sparky Information</h2>
          <p>Unable to load Sparky details.</p>
          <button onClick={handleBackToDashboard} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sparky-details">
      <header className="sparky-header">
        <div className="header-content">
          <button onClick={handleBackToDashboard} className="back-button">
            ← Back to Dashboard
          </button>
          <h1>Sparky Details</h1>
        </div>
      </header>

      <main className="sparky-main">
        {error && <div className="error-banner">{error}</div>}

        {/* Sparky Information */}
        <div className="sparky-info-section">
          <h2>Sparky Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Serial Number:</label>
              <span>{sparky.serialNumber}</span>
            </div>
            <div className="info-item">
              <label>Box Code:</label>
              <span>{sparky.boxCode}</span>
            </div>
            <div className="info-item">
              <label>UUID:</label>
              <span className="uuid">{sparky.uuid}</span>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="address-info-section">
          <h2>Address Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Address UUID:</label>
              <span className="uuid">{address?.uuid}</span>
            </div>
            <div className="info-item">
              <label>Group:</label>
              <span>{group?.name}</span>
            </div>
          </div>
        </div>

        {/* Real-time Energy Graph */}
        <EnergyGraph sparkySerialNumber={sparky.serialNumber} />

        {/* Sparky Data Sections */}
        <div className="data-sections">
          <div className="section-header">
            <h2>Sparky Data</h2>
            <div className="header-controls">
              <div className="date-picker">
                <label htmlFor="date-picker">Date for 15min data:</label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <button 
                onClick={fetchSparkyData} 
                className="refresh-button"
                disabled={Object.values(loading).some(Boolean)}
              >
                {Object.values(loading).some(Boolean) ? 'Refreshing...' : 'Refresh All'}
              </button>
            </div>
          </div>

          <div className="data-grid">
            {renderDataSection('Sparky Details', sparkyData.details, 'details', 'details')}
            {renderDataSection('Access Information', sparkyData.access, 'access', 'access')}
            {renderDataSection('Electricity Latest', sparkyData.electricityLatest, 'electricityLatest', 'electricityLatest')}
            {renderDataSection('Electricity Latest P1', sparkyData.electricityLatestP1, 'electricityLatestP1', 'electricityLatestP1')}
            {renderDataSection('Electricity First', sparkyData.electricityFirst, 'electricityFirst', 'electricityFirst')}
            {renderDataSection('Electricity 15min', sparkyData.electricity15min, 'electricity15min', 'electricity15min')}
            {renderDataSection('Gas 15min', sparkyData.gas15min, 'gas15min', 'gas15min')}
            {renderDataSection('Total 15min', sparkyData.total15min, 'total15min', 'total15min')}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SparkyDetails;