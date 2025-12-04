import React, { useState, useEffect } from 'react';
import './ScheduleModal.css';

const ScheduleModal = ({ isOpen, onClose, onSave, schedule = null, bulkMode = false, inverterCount = 0 }) => {
  const [scheduleType, setScheduleType] = useState('powerLimit'); // 'powerLimit' or 'zeroExport'
  const [powerLimit, setPowerLimit] = useState(100);
  const [scheduleTime, setScheduleTime] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (schedule) {
      // Edit mode - populate form with existing schedule data
      if (schedule.zeroExport) {
        setScheduleType('zeroExport');
      } else {
        setScheduleType('powerLimit');
        setPowerLimit(schedule.powerlimit || 100);
      }
      
      // Format time for datetime-local input (YYYY-MM-DDTHH:mm)
      if (schedule.time) {
        const date = new Date(schedule.time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setScheduleTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      }
    } else {
      // Create mode - set defaults
      setScheduleType('powerLimit');
      setPowerLimit(100);
      // Set default time to now
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setScheduleTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
    setErrors({});
  }, [schedule, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    // Validate schedule time
    if (!scheduleTime) {
      newErrors.scheduleTime = 'Schedule time is required';
    } else {
      const selectedTime = new Date(scheduleTime);
      if (isNaN(selectedTime.getTime())) {
        newErrors.scheduleTime = 'Invalid date/time';
      }
    }
    
    // Validate power limit if power limit type is selected
    if (scheduleType === 'powerLimit') {
      if (powerLimit === '' || powerLimit === null || powerLimit === undefined) {
        newErrors.powerLimit = 'Power limit is required';
      } else if (powerLimit < 0 || powerLimit > 100) {
        newErrors.powerLimit = 'Power limit must be between 0 and 100';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Format time as ISO 8601 string
    const timeISO = new Date(scheduleTime).toISOString();
    
    // Prepare schedule data
    const scheduleData = {
      time: timeISO
    };
    
    if (scheduleType === 'powerLimit') {
      scheduleData.powerlimit = parseInt(powerLimit, 10);
      // Do not include zeroExport when using powerLimit
    } else {
      scheduleData.zeroExport = true;
      // Do not include powerlimit when using zeroExport
    }
    
    onSave(scheduleData);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-modal-overlay" onClick={handleClose}>
      <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <h2>
            {bulkMode 
              ? `Create Schedule for All Steerable Inverters${inverterCount > 0 ? ` (${inverterCount})` : ''}`
              : schedule ? 'Edit Schedule' : 'Create Schedule'
            }
          </h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="schedule-modal-form">
          <div className="form-group">
            <label htmlFor="scheduleTime">Schedule Time *</label>
            <input
              type="datetime-local"
              id="scheduleTime"
              value={scheduleTime}
              onChange={(e) => {
                setScheduleTime(e.target.value);
                if (errors.scheduleTime) {
                  setErrors({ ...errors, scheduleTime: '' });
                }
              }}
              className={errors.scheduleTime ? 'error' : ''}
            />
            {errors.scheduleTime && (
              <span className="error-message">{errors.scheduleTime}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Schedule Type *</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="scheduleType"
                  value="powerLimit"
                  checked={scheduleType === 'powerLimit'}
                  onChange={(e) => {
                    setScheduleType(e.target.value);
                    setErrors({ ...errors, powerLimit: '' });
                  }}
                />
                <span>Power Limit</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="scheduleType"
                  value="zeroExport"
                  checked={scheduleType === 'zeroExport'}
                  onChange={(e) => setScheduleType(e.target.value)}
                />
                <span>Zero Export</span>
              </label>
            </div>
            <p className="form-help">
              {scheduleType === 'powerLimit' 
                ? 'Limit the inverter power output to a percentage (0-100%)'
                : 'Automatically balance production to export no more than is consumed'}
            </p>
          </div>
          
          {scheduleType === 'powerLimit' && (
            <div className="form-group">
              <label htmlFor="powerLimit">Power Limit (%) *</label>
              <input
                type="number"
                id="powerLimit"
                min="0"
                max="100"
                value={powerLimit}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setPowerLimit(value);
                  if (errors.powerLimit) {
                    setErrors({ ...errors, powerLimit: '' });
                  }
                }}
                className={errors.powerLimit ? 'error' : ''}
              />
              {errors.powerLimit && (
                <span className="error-message">{errors.powerLimit}</span>
              )}
              <p className="form-help">Enter a value between 0 and 100</p>
            </div>
          )}
          
          {scheduleType === 'zeroExport' && (
            <div className="form-group">
              <div className="zero-export-info">
                <p>Zero Export mode will automatically balance the production of the solar panels to export no more than is consumed in the house.</p>
              </div>
            </div>
          )}
          
          {bulkMode && inverterCount > 0 && (
            <div className="form-group">
              <div className="bulk-schedule-info">
                <p>This schedule will be applied to <strong>{inverterCount}</strong> steerable inverter{inverterCount !== 1 ? 's' : ''}.</p>
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" className="button-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary">
              {bulkMode 
                ? `Create Schedule for All (${inverterCount})`
                : schedule ? 'Update Schedule' : 'Create Schedule'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;

