import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { devicesAPI } from '../services/api';
import './DevicesDetails.css';

const DevicesDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, group } = location.state || {};
  
  const [devices, setDevices] = useState({
    vehicles: [],
    chargers: [],
    solarInverters: [],
    smartMeters: [],
    hvacs: [],
    batteries: [],
    gridConnections: []
  });
  
  const [loading, setLoading] = useState({
    devices: false
  });
  
  const [error, setError] = useState('');
  const [deviceErrors, setDeviceErrors] = useState({});
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [selectedDeviceJson, setSelectedDeviceJson] = useState(null);

  useEffect(() => {
    if (address && group) {
      fetchDevices(group.uuid, address.uuid);
    }
  }, [address, group]);

  const fetchDevices = async (groupUuid, addressUuid) => {
    setLoading(prev => ({ ...prev, devices: true }));
    setError('');
    setDeviceErrors({});
    
    // Fetch all device types in parallel, but handle each independently
    const deviceFetches = [
      { key: 'vehicles', apiCall: () => devicesAPI.getVehicles(addressUuid) },
      { key: 'chargers', apiCall: () => devicesAPI.getChargers(addressUuid) },
      { key: 'solarInverters', apiCall: () => devicesAPI.getSolarInverters(addressUuid) },
      { key: 'smartMeters', apiCall: () => devicesAPI.getSmartMeters(addressUuid) },
      { key: 'hvacs', apiCall: () => devicesAPI.getHvacs(addressUuid) },
      { key: 'batteries', apiCall: () => devicesAPI.getBatteries(addressUuid) },
      { key: 'gridConnections', apiCall: () => devicesAPI.getGridConnections(addressUuid) }
    ];

    // Use Promise.allSettled to handle each device type independently
    const results = await Promise.allSettled(
      deviceFetches.map(fetch => fetch.apiCall())
    );

    // Extract results from each API response (handle both { results: [...] } and direct array)
    const extractResults = (data) => Array.isArray(data) ? data : (data?.results || []);

    const newDevices = {
      vehicles: [],
      chargers: [],
      solarInverters: [],
      smartMeters: [],
      hvacs: [],
      batteries: [],
      gridConnections: []
    };

    const newDeviceErrors = {};

    // Process each result
    results.forEach((result, index) => {
      const deviceKey = deviceFetches[index].key;
      
      if (result.status === 'fulfilled') {
        try {
          const data = result.value;
          console.log(`${deviceKey} API response:`, data);
          newDevices[deviceKey] = extractResults(data);
        } catch (err) {
          console.error(`Error processing ${deviceKey} data:`, err);
          newDeviceErrors[deviceKey] = `Failed to process ${deviceKey} data`;
        }
      } else {
        // Handle rejected promise
        const error = result.reason;
        console.error(`Error fetching ${deviceKey}:`, error);
        newDeviceErrors[deviceKey] = `Failed to fetch ${deviceKey}`;
        newDevices[deviceKey] = []; // Set empty array for failed device type
      }
    });

    setDevices(newDevices);
    setDeviceErrors(newDeviceErrors);
    setLoading(prev => ({ ...prev, devices: false }));
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleViewDeviceJson = (device) => {
    setSelectedDeviceJson(device);
    setJsonModalOpen(true);
  };

  const handleCloseJsonModal = () => {
    setJsonModalOpen(false);
    setSelectedDeviceJson(null);
  };

  const handleCopyJson = () => {
    if (selectedDeviceJson) {
      const jsonString = JSON.stringify(selectedDeviceJson, null, 2);
      navigator.clipboard.writeText(jsonString).then(() => {
        alert('JSON copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy JSON:', err);
      });
    }
  };

  if (!address || !group) {
    return (
      <div className="devices-details">
        <div className="error-state">
          <h2>No Address Information</h2>
          <p>Unable to load device details.</p>
          <button onClick={handleBackToDashboard} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="devices-details">
      <header className="devices-header">
        <div className="header-content">
          <button onClick={handleBackToDashboard} className="back-button">
            ← Back to Dashboard
          </button>
          <h1>Devices</h1>
        </div>
      </header>

      <main className="devices-main">
        {error && <div className="error-banner">{error}</div>}

        {/* Address Information */}
        <div className="address-info-section">
          <h2>Address Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Address UUID:</label>
              <span className="uuid">{address.uuid}</span>
            </div>
            <div className="info-item">
              <label>Group:</label>
              <span>{group.name}</span>
            </div>
            {address.sparky && (
              <div className="info-item">
                <label>Sparky Serial:</label>
                <span>{address.sparky.serialNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Devices Section */}
        {loading.devices ? (
          <div className="loading">Loading devices...</div>
        ) : (
          <div className="devices-container">
            {/* Vehicles */}
            {deviceErrors.vehicles && (
              <div className="device-error-message">
                ⚠️ {deviceErrors.vehicles}
              </div>
            )}
            {devices.vehicles.length > 0 && (
              <div className="device-category">
                <h3>🚗 Vehicles ({devices.vehicles.length})</h3>
                <div className="device-list">
                  {devices.vehicles.map((vehicle) => (
                    <div key={vehicle.identifier} className="device-card vehicle-card">
                      <div className="device-header">
                        <div>
                          <span className="device-brand">{vehicle.info.brand}</span>
                          <span className="device-model">{vehicle.info.model}</span>
                        </div>
                        <button 
                          className="json-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDeviceJson(vehicle);
                          }}
                          title="View JSON"
                        >
                          📄
                        </button>
                      </div>
                      <div className="device-details">
                        <div className="detail-item">
                          <span className="label">VIN:</span>
                          <span className="value">{vehicle.vin}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Year:</span>
                          <span className="value">{vehicle.info.year}</span>
                        </div>
                        {vehicle.lastChargeState && (
                          <div className="detail-item">
                            <span className="label">Battery:</span>
                            <span className="value">
                              {typeof vehicle.lastChargeState.batteryLevel === 'object' 
                                ? (vehicle.lastChargeState.batteryLevel?.percent || 0)
                                : (vehicle.lastChargeState.batteryLevel || 0)
                              }%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chargers */}
            {deviceErrors.chargers && (
              <div className="device-error-message">
                ⚠️ {deviceErrors.chargers}
              </div>
            )}
            {devices.chargers.length > 0 && (
              <div className="device-category">
                <h3>🔌 Chargers ({devices.chargers.length})</h3>
                <div className="device-list">
                  {devices.chargers.map((charger) => (
                    <div key={charger.identifier} className="device-card charger-card">
                      <div className="device-header">
                        <div>
                          <span className="device-brand">{charger.brand}</span>
                          <span className="device-model">{charger.model}</span>
                        </div>
                        <button 
                          className="json-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDeviceJson(charger);
                          }}
                          title="View JSON"
                        >
                          📄
                        </button>
                      </div>
                      <div className="device-details">
                        <div className="detail-item">
                          <span className="label">Status:</span>
                          <span className="value">{charger.lastChargeState?.powerDeliveryState || 'Unknown'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Max Current:</span>
                          <span className="value">{charger.lastChargeState?.maxCurrent || 0}A</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Solar Inverters */}
            {deviceErrors.solarInverters && (
              <div className="device-error-message">
                ⚠️ {deviceErrors.solarInverters}
              </div>
            )}
            {devices.solarInverters.length > 0 && (
              <div className="device-category">
                <h3>☀️ Solar Inverters ({devices.solarInverters.length})</h3>
                <div className="device-list">
                  {devices.solarInverters.map((inverter) => (
                    <div key={inverter.identifier} className="device-card solar-card">
                      <div className="device-header">
                        <div>
                          <span className="device-brand">{inverter.brand}</span>
                          <span className="device-model">{inverter.model}</span>
                        </div>
                        <button 
                          className="json-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDeviceJson(inverter);
                          }}
                          title="View JSON"
                        >
                          📄
                        </button>
                      </div>
                      <div className="device-details">
                        <div className="detail-item">
                          <span className="label">Site:</span>
                          <span className="value">{inverter.siteName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Status:</span>
                          <span className="value">{inverter.isReachable ? 'Online' : 'Offline'}</span>
                        </div>
                        {inverter.lastProductionState && (
                          <div className="detail-item">
                            <span className="label">Production:</span>
                            <span className="value">{inverter.lastProductionState.productionRate}W</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Meters */}
            {deviceErrors.smartMeters && (
              <div className="device-error-message">
                ⚠️ {deviceErrors.smartMeters}
              </div>
            )}
            {devices.smartMeters.length > 0 && (
              <div className="device-category">
                <h3>📊 Smart Meters ({devices.smartMeters.length})</h3>
                <div className="device-list">
                  {devices.smartMeters.map((meter) => (
                    <div key={meter.identifier} className="device-card meter-card">
                      <div className="device-header">
                        <div>
                          <span className="device-brand">{meter.smartMeterType}</span>
                        </div>
                        <button 
                          className="json-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDeviceJson(meter);
                          }}
                          title="View JSON"
                        >
                          📄
                        </button>
                      </div>
                      <div className="device-details">
                        <div className="detail-item">
                          <span className="label">Meter #:</span>
                          <span className="value">{meter.meterNumber}</span>
                        </div>
                        {meter.gasMeterNumber && (
                          <div className="detail-item">
                            <span className="label">Gas Meter #:</span>
                            <span className="value">{meter.gasMeterNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HVACs */}
            {deviceErrors.hvacs && (
              <div className="device-error-message">
                ⚠️ {deviceErrors.hvacs}
              </div>
            )}
            {devices.hvacs.length > 0 && (
              <div className="device-category">
                <h3>🌡️ HVAC Systems ({devices.hvacs.length})</h3>
                <div className="device-list">
                  {devices.hvacs.map((hvac) => (
                    <div key={hvac.identifier} className="device-card hvac-card">
                      <div className="device-header">
                        <div>
                          <span className="device-brand">{hvac.brand}</span>
                          <span className="device-model">{hvac.model}</span>
                        </div>
                        <button 
                          className="json-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDeviceJson(hvac);
                          }}
                          title="View JSON"
                        >
                          📄
                        </button>
                      </div>
                      <div className="device-details">
                        <div className="detail-item">
                          <span className="label">Name:</span>
                          <span className="value">{hvac.displayName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Category:</span>
                          <span className="value">{hvac.category}</span>
                        </div>
                        {hvac.lastTemperatureState && (
                          <div className="detail-item">
                            <span className="label">Temperature:</span>
                            <span className="value">{hvac.lastTemperatureState.currentTemperature}°C</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Batteries */}
            {deviceErrors.batteries && (
              <div className="device-error-message">
                ⚠️ {deviceErrors.batteries}
              </div>
            )}
            {devices.batteries.length > 0 && (
              <div className="device-category">
                <h3>🔋 Batteries ({devices.batteries.length})</h3>
                <div className="device-list">
                  {devices.batteries.map((battery) => (
                    <div key={battery.identifier} className="device-card battery-card">
                      <div className="device-header">
                        <div>
                          <span className="device-brand">{battery.brand}</span>
                          <span className="device-model">{battery.model}</span>
                        </div>
                        <button 
                          className="json-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDeviceJson(battery);
                          }}
                          title="View JSON"
                        >
                          📄
                        </button>
                      </div>
                      <div className="device-details">
                        <div className="detail-item">
                          <span className="label">Site:</span>
                          <span className="value">{battery.siteName}</span>
                        </div>
                        {battery.lastChargeState && battery.lastChargeState.batteryLevel && (
                          <div className="detail-item">
                            <span className="label">Level:</span>
                            <span className="value">{battery.lastChargeState.batteryLevel.percent || 0}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grid Connections */}
            {deviceErrors.gridConnections && (
              <div className="device-error-message">
                ⚠️ {deviceErrors.gridConnections}
              </div>
            )}
            {devices.gridConnections.length > 0 && (
              <div className="device-category">
                <h3>⚡ Grid Connections ({devices.gridConnections.length})</h3>
                <div className="device-list">
                  {devices.gridConnections.map((connection) => (
                    <div key={connection.identifier} className="device-card grid-card">
                      <div className="device-header">
                        <div>
                          <span className="device-brand">Grid Connection</span>
                        </div>
                        <button 
                          className="json-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDeviceJson(connection);
                          }}
                          title="View JSON"
                        >
                          📄
                        </button>
                      </div>
                      <div className="device-details">
                        <div className="detail-item">
                          <span className="label">Phase 1:</span>
                          <span className="value">{connection.phaseOneCapacity?.capacity || 0}A</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Phase 2:</span>
                          <span className="value">{connection.phaseTwoCapacity?.capacity || 0}A</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Phase 3:</span>
                          <span className="value">{connection.phaseThreeCapacity?.capacity || 0}A</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No devices message */}
            {Object.values(devices).every(deviceArray => deviceArray.length === 0) && 
             Object.keys(deviceErrors).length === 0 && (
              <div className="placeholder">No devices found for this address</div>
            )}
          </div>
        )}
      </main>

      {/* JSON Modal */}
      {jsonModalOpen && selectedDeviceJson && (
        <div className="json-modal-overlay" onClick={handleCloseJsonModal}>
          <div className="json-modal" onClick={(e) => e.stopPropagation()}>
            <div className="json-modal-header">
              <h3>Device JSON Data</h3>
              <div className="json-modal-actions">
                <button 
                  className="copy-json-button"
                  onClick={handleCopyJson}
                  title="Copy JSON to clipboard"
                >
                  📋 Copy
                </button>
                <button 
                  className="close-json-button"
                  onClick={handleCloseJsonModal}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="json-modal-content">
              <pre className="json-display">
                <code>{JSON.stringify(selectedDeviceJson, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesDetails;

