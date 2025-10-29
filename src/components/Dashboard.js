import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { groupsAPI, addressesAPI, devicesAPI, sparkyAPI } from '../services/api';
import ChargeeLogo from './ChargeeLogo';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [devices, setDevices] = useState({
    vehicles: [],
    chargers: [],
    solarInverters: [],
    smartMeters: [],
    hvacs: [],
    batteries: [],
    gridConnections: []
  });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState({
    groups: false,
    addresses: false,
    devices: false,
    adminQuery: false
  });
  const [error, setError] = useState('');
  const [adminQuery, setAdminQuery] = useState('');
  const [adminQueryResult, setAdminQueryResult] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressPage, setAddressPage] = useState(1);
  const addressesPerPage = 20;
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [selectedDeviceJson, setSelectedDeviceJson] = useState(null);

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  // Restore selection from URL after groups load
  useEffect(() => {
    const groupUuid = searchParams.get('group');
    
    if (groupUuid && groups.length > 0 && !selectedGroup) {
      const group = groups.find(g => g.uuid === groupUuid);
      if (group) {
        setSelectedGroup(group);
        fetchAddresses(group.uuid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, searchParams]);

  // Restore address selection after addresses load
  useEffect(() => {
    const addressUuid = searchParams.get('address');
    
    if (addressUuid && addresses.length > 0 && !selectedAddress && selectedGroup) {
      const address = addresses.find(a => a.uuid === addressUuid);
      if (address) {
        setSelectedAddress(address);
        fetchDevices(selectedGroup.uuid, address.uuid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, selectedGroup, searchParams]);

  // Update URL when selection changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGroup) {
      params.set('group', selectedGroup.uuid);
    }
    if (selectedAddress) {
      params.set('address', selectedAddress.uuid);
    }
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, selectedAddress]);

  const fetchGroups = async () => {
    setLoading(prev => ({ ...prev, groups: true }));
    setError('');
    try {
      const data = await groupsAPI.getGroups();
      console.log('Groups API response:', data); // Debug log
      // Handle the actual API response structure: { meta: {...}, results: [...] }
      const groupsArray = data?.results || [];
      setGroups(groupsArray);
    } catch (err) {
      setError('Failed to fetch groups');
      console.error('Error fetching groups:', err);
      setGroups([]); // Ensure groups is always an array
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const fetchAddresses = async (groupUuid) => {
    setLoading(prev => ({ ...prev, addresses: true }));
    setError('');
    try {
      const data = await addressesAPI.getAddresses(groupUuid);
      console.log('Addresses API response:', data); // Debug log
      console.log('Addresses array:', data?.results); // Debug log
      console.log('Total count:', data?.meta?.total); // Debug log
      // Handle the actual API response structure: { meta: {...}, results: [...] }
      const addressesArray = data?.results || [];
      console.log('Processed addresses array:', addressesArray); // Debug log
      setAddresses(addressesArray);
      setDevices({
        vehicles: [],
        chargers: [],
        solarInverters: [],
        smartMeters: [],
        hvacs: [],
        batteries: [],
        gridConnections: []
      }); // Clear devices when selecting new group
      setSelectedAddress(null);
    } catch (err) {
      setError('Failed to fetch addresses');
      console.error('Error fetching addresses:', err);
      setAddresses([]); // Ensure addresses is always an array
    } finally {
      setLoading(prev => ({ ...prev, addresses: false }));
    }
  };

  const fetchDevices = async (groupUuid, addressUuid) => {
    setLoading(prev => ({ ...prev, devices: true }));
    setError('');
    try {
      // Fetch all device types in parallel
      const [
        vehiclesData,
        chargersData,
        solarInvertersData,
        smartMetersData,
        hvacsData,
        batteriesData,
        gridConnectionsData
      ] = await Promise.all([
        devicesAPI.getVehicles(addressUuid),
        devicesAPI.getChargers(addressUuid),
        devicesAPI.getSolarInverters(addressUuid),
        devicesAPI.getSmartMeters(addressUuid),
        devicesAPI.getHvacs(addressUuid),
        devicesAPI.getBatteries(addressUuid),
        devicesAPI.getGridConnections(addressUuid)
      ]);

      console.log('Devices API responses:', {
        vehiclesData,
        chargersData,
        solarInvertersData,
        smartMetersData,
        hvacsData,
        batteriesData,
        gridConnectionsData
      });

      // Extract results from each API response (handle both { results: [...] } and direct array)
      const extractResults = (data) => Array.isArray(data) ? data : (data?.results || []);

      setDevices({
        vehicles: extractResults(vehiclesData),
        chargers: extractResults(chargersData),
        solarInverters: extractResults(solarInvertersData),
        smartMeters: extractResults(smartMetersData),
        hvacs: extractResults(hvacsData),
        batteries: extractResults(batteriesData),
        gridConnections: extractResults(gridConnectionsData)
      });
    } catch (err) {
      setError('Failed to fetch devices');
      console.error('Error fetching devices:', err);
      setDevices({
        vehicles: [],
        chargers: [],
        solarInverters: [],
        smartMeters: [],
        hvacs: [],
        batteries: [],
        gridConnections: []
      });
    } finally {
      setLoading(prev => ({ ...prev, devices: false }));
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedAddress(null); // Clear selected address when changing groups
    setAddressSearch('');
    setAddressPage(1);
    fetchAddresses(group.uuid);
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    // Use the address UUID for fetching devices
    fetchDevices(selectedGroup.uuid, address.uuid);
  };

  const handleLogout = () => {
    logout();
  };

  const handleViewSparky = (address) => {
    if (address.sparky) {
      navigate('/sparky-details', {
        state: {
          sparky: address.sparky,
          address: address,
          group: selectedGroup
        }
      });
    }
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
        // Optional: show a brief success message
        alert('JSON copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy JSON:', err);
      });
    }
  };

  const handleAdminQuery = async () => {
    if (!adminQuery.trim()) return;
    
    setLoading(prev => ({ ...prev, adminQuery: true }));
    setError('');
    setAdminQueryResult(null);
    
    try {
      const query = adminQuery.trim();
      
      // Try to determine if it's a Sparky serial number or address UUID
      // Sparky serial numbers are typically alphanumeric (e.g., "6055F9C9D650")
      // Address UUIDs are typically UUID format
      const isSparkySerial = /^[A-Z0-9]+$/.test(query) && query.length >= 10;
      
      if (isSparkySerial) {
        // Query Sparky device
        const sparkyData = await sparkyAPI.getSparkyDetails(query);
        setAdminQueryResult({
          type: 'sparky',
          data: sparkyData
        });
      } else {
        // Query address devices
        const [vehiclesData, chargersData, solarInvertersData, smartMetersData, hvacsData, batteriesData, gridConnectionsData] = await Promise.all([
          devicesAPI.getVehicles(query),
          devicesAPI.getChargers(query),
          devicesAPI.getSolarInverters(query),
          devicesAPI.getSmartMeters(query),
          devicesAPI.getHvacs(query),
          devicesAPI.getBatteries(query),
          devicesAPI.getGridConnections(query)
        ]);
        
        // Extract results from each API response (handle both { results: [...] } and direct array)
        const extractResults = (data) => Array.isArray(data) ? data : (data?.results || []);
        
        setAdminQueryResult({
          type: 'address',
          data: {
            vehicles: extractResults(vehiclesData),
            chargers: extractResults(chargersData),
            solarInverters: extractResults(solarInvertersData),
            smartMeters: extractResults(smartMetersData),
            hvacs: extractResults(hvacsData),
            batteries: extractResults(batteriesData),
            gridConnections: extractResults(gridConnectionsData)
          }
        });
      }
    } catch (err) {
      setError(`Failed to query ${adminQuery}: ${err.response?.data?.message || err.message}`);
      console.error('Admin query error:', err);
    } finally {
      setLoading(prev => ({ ...prev, adminQuery: false }));
    }
  };

  // Filter and paginate addresses
  const filteredAddresses = addresses.filter((address) => {
    if (!addressSearch.trim()) return true;
    const searchLower = addressSearch.toLowerCase();
    return (
      address.uuid.toLowerCase().includes(searchLower) ||
      address.sparky?.serialNumber?.toLowerCase().includes(searchLower) ||
      address.sparky?.boxCode?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredAddresses.length / addressesPerPage);
  const startIndex = (addressPage - 1) * addressesPerPage;
  const endIndex = startIndex + addressesPerPage;
  const paginatedAddresses = filteredAddresses.slice(startIndex, endIndex);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <ChargeeLogo size="medium" className="dashboard-logo" />
          <h1>Chargee Developer Sandbox</h1>
          <div className="user-info">
            <div className="user-details">
              <span>Welcome, {user?.email || 'User'}</span>
              {user?.role && (
                <span className={`role-badge role-${user.role}`}>
                  {user.role.toUpperCase()}
                </span>
              )}
            </div>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <div className="error-banner">{error}</div>}

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="admin-section">
            <h2>🔧 Admin Tools</h2>
            <div className="admin-tools">
              <div className="query-box">
                <h3>Direct Query</h3>
                <p>Query any address or Sparky device directly by UUID/Serial</p>
                <div className="query-controls">
                  <input
                    type="text"
                    placeholder="Enter Address UUID or Sparky Serial Number"
                    value={adminQuery}
                    onChange={(e) => setAdminQuery(e.target.value)}
                    className="query-input"
                  />
                  <button 
                    onClick={handleAdminQuery}
                    disabled={!adminQuery.trim() || loading.adminQuery}
                    className="query-button"
                  >
                    {loading.adminQuery ? 'Querying...' : 'Query'}
                  </button>
                </div>
                {adminQueryResult && (
                  <div className="query-result">
                    <h4>Query Result:</h4>
                    {adminQueryResult.type === 'sparky' ? (
                      <div className="sparky-result">
                        <h5>🔌 Sparky Device Details</h5>
                        <div className="sparky-info">
                          <div className="info-item">
                            <span className="label">Serial Number:</span>
                            <span className="value">{adminQueryResult.data?.serialNumber || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Box Code:</span>
                            <span className="value">{adminQueryResult.data?.boxCode || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Status:</span>
                            <span className="value">{adminQueryResult.data?.status || 'Unknown'}</span>
                          </div>
                        </div>
                        <button 
                          className="view-sparky-button"
                          onClick={() => {
                            navigate('/sparky-details', {
                              state: {
                                sparky: adminQueryResult.data,
                                address: null,
                                group: null
                              }
                            });
                          }}
                        >
                          View Full Sparky Details
                        </button>
                      </div>
                    ) : (
                      <div className="address-result">
                        <h5>🏠 Address Devices</h5>
                        <div className="devices-container">
                          {/* Vehicles */}
                          {adminQueryResult.data.vehicles?.length > 0 && (
                            <div className="device-category">
                              <h3>🚗 Vehicles ({adminQueryResult.data.vehicles.length})</h3>
                              <div className="device-list">
                                {adminQueryResult.data.vehicles.map((vehicle) => (
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
                                          <span className="value">{vehicle.lastChargeState.batteryLevel}%</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Chargers */}
                          {adminQueryResult.data.chargers?.length > 0 && (
                            <div className="device-category">
                              <h3>🔌 Chargers ({adminQueryResult.data.chargers.length})</h3>
                              <div className="device-list">
                                {adminQueryResult.data.chargers.map((charger) => (
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
                          {adminQueryResult.data.solarInverters?.length > 0 && (
                            <div className="device-category">
                              <h3>☀️ Solar Inverters ({adminQueryResult.data.solarInverters.length})</h3>
                              <div className="device-list">
                                {adminQueryResult.data.solarInverters.map((inverter) => (
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
                          {adminQueryResult.data.smartMeters?.length > 0 && (
                            <div className="device-category">
                              <h3>📊 Smart Meters ({adminQueryResult.data.smartMeters.length})</h3>
                              <div className="device-list">
                                {adminQueryResult.data.smartMeters.map((meter) => (
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
                          {adminQueryResult.data.hvacs?.length > 0 && (
                            <div className="device-category">
                              <h3>🌡️ HVAC Systems ({adminQueryResult.data.hvacs.length})</h3>
                              <div className="device-list">
                                {adminQueryResult.data.hvacs.map((hvac) => (
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
                          {adminQueryResult.data.batteries?.length > 0 && (
                            <div className="device-category">
                              <h3>🔋 Batteries ({adminQueryResult.data.batteries.length})</h3>
                              <div className="device-list">
                                {adminQueryResult.data.batteries.map((battery) => (
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
                                      {battery.lastChargeState && (
                                        <div className="detail-item">
                                          <span className="label">Level:</span>
                                          <span className="value">{battery.lastChargeState.batteryLevel}%</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Grid Connections */}
                          {adminQueryResult.data.gridConnections?.length > 0 && (
                            <div className="device-category">
                              <h3>⚡ Grid Connections ({adminQueryResult.data.gridConnections.length})</h3>
                              <div className="device-list">
                                {adminQueryResult.data.gridConnections.map((connection) => (
                                  <div key={connection.identifier} className="device-card grid-card">
                                    <div className="device-header">
                                      <div>
                                        <span className="device-brand">Grid Connection</span>
                                        <span className="device-model">Type {connection.type}</span>
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
                          {Object.values(adminQueryResult.data).every(deviceArray => !deviceArray || deviceArray.length === 0) && (
                            <div className="placeholder">No devices found for this address</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Groups Section */}
          <div className="section">
            <h2>Groups</h2>
            {loading.groups ? (
              <div className="loading">Loading groups...</div>
            ) : Array.isArray(groups) && groups.length > 0 ? (
              <div className="list">
                {groups.map((group) => (
                  <div
                    key={group.uuid}
                    className={`list-item ${selectedGroup?.uuid === group.uuid ? 'selected' : ''}`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <div className="item-title">{group.name}</div>
                    <div className="item-subtitle uuid">{group.uuid}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder">No groups found</div>
            )}
          </div>

          {/* Addresses Section */}
          <div className="section">
            <div className="section-header">
              <h2>Addresses</h2>
              {selectedGroup && addresses.length > 0 && (
                <span className="section-count">({addresses.length})</span>
              )}
            </div>
            {!selectedGroup ? (
              <div className="placeholder">Select a group to view addresses</div>
            ) : loading.addresses ? (
              <div className="loading">Loading addresses...</div>
            ) : Array.isArray(addresses) && addresses.length > 0 ? (
              <>
                {/* Search Box */}
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search by UUID, serial number, or box code..."
                    value={addressSearch}
                    onChange={(e) => {
                      setAddressSearch(e.target.value);
                      setAddressPage(1); // Reset to first page on search
                    }}
                    className="search-input"
                  />
                </div>

                {/* Addresses List */}
                <div className="list">
                  {paginatedAddresses.length > 0 ? (
                    paginatedAddresses.map((address) => (
                      <div
                        key={address.uuid}
                        className={`list-item ${selectedAddress?.uuid === address.uuid ? 'selected' : ''}`}
                      >
                        <div 
                          className="address-content"
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="item-title uuid">{address.uuid}</div>
                          <div className="item-subtitle">Sparky: {address.sparky?.serialNumber || 'Unknown'}</div>
                          <div className="item-details">
                            <span className="status">Box: {address.sparky?.boxCode || 'N/A'}</span>
                          </div>
                        </div>
                        {address.sparky && (
                          <button 
                            className="sparky-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSparky(address);
                            }}
                          >
                            View Sparky
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="placeholder">No addresses match your search</div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <div className="pagination-info">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredAddresses.length)} of {filteredAddresses.length}
                    </div>
                    <div className="pagination-controls">
                      <button
                        onClick={() => setAddressPage(prev => Math.max(1, prev - 1))}
                        disabled={addressPage === 1}
                        className="pagination-button"
                      >
                        Previous
                      </button>
                      <span className="pagination-pages">
                        Page {addressPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setAddressPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={addressPage === totalPages}
                        className="pagination-button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="placeholder">No addresses found</div>
            )}
          </div>

          {/* Devices Section */}
          <div className="section">
            <h2>Devices</h2>
            {!selectedAddress ? (
              <div className="placeholder">Select an address to view devices</div>
            ) : loading.devices ? (
              <div className="loading">Loading devices...</div>
            ) : (
              <div className="devices-container">
                {/* Vehicles */}
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
                                <span className="value">{vehicle.lastChargeState.batteryLevel}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chargers */}
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
                            {battery.lastChargeState && (
                              <div className="detail-item">
                                <span className="label">Level:</span>
                                <span className="value">{battery.lastChargeState.batteryLevel}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid Connections */}
                {devices.gridConnections.length > 0 && (
                  <div className="device-category">
                    <h3>⚡ Grid Connections ({devices.gridConnections.length})</h3>
                    <div className="device-list">
                      {devices.gridConnections.map((connection) => (
                        <div key={connection.identifier} className="device-card grid-card">
                          <div className="device-header">
                            <div>
                              <span className="device-brand">Grid Connection</span>
                              <span className="device-model">Type {connection.type}</span>
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
                {Object.values(devices).every(deviceArray => deviceArray.length === 0) && (
                  <div className="placeholder">No devices found for this address</div>
                )}
              </div>
            )}
          </div>
        </div>
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

export default Dashboard;
