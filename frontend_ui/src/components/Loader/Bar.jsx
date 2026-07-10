import React from 'react';

// ==============================|| BAR ||============================== //

const Bar = ({ animationDuration, progress }) => {
  return (
    <div
        style={{
            background: 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)',
            height: 3,
            left: 0,
            marginLeft: `${(-1 + progress) * 100}%`,
            position: 'fixed',
            top: 0,
            transition: `margin-left ${animationDuration}ms linear`,
            width: '100%',
            zIndex: 2000
        }}
    />
  );
};

export default Bar;
