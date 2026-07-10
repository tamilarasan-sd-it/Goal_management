import React from 'react';

// ==============================|| SPINNER ||============================== //

const Spinner = () => {
  return (
    <div
      style={{
        display: 'block',
        position: 'fixed',
        right: 15,
        top: 15,
        zIndex: 2000
      }}
    >
      <div
        style={{
          animation: 'spin 500ms linear infinite',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          borderTopColor: '#fff',
          boxSizing: 'border-box',
          height: 24,
          width: 24
        }}
      />
    </div>
  );
};

export default Spinner;
