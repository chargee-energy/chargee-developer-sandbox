import React from 'react';

const ChargeeLogo = ({ className = '', size = 'medium', variant = 'full' }) => {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large'
  };

  const logoClass = `chargee-logo ${sizeClasses[size]} ${className}`;

  return (
    <div className={logoClass}>
      {variant === 'full' ? (
        <div className="logo-full">
          <div className="logo-icon">
            <img 
              src="https://www.chargee.energy/images/chargee-icon.svg" 
              alt="Chargee Logo" 
              className="logo-svg"
            />
          </div>
        </div>
      ) : (
        <div className="logo-icon-only">
          <img 
            src="https://www.chargee.energy/images/chargee-icon.svg" 
            alt="Chargee Logo" 
            className="logo-svg"
          />
        </div>
      )}
    </div>
  );
};

export default ChargeeLogo;
