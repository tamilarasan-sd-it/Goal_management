import { IconButton } from '@mui/material';
import AnimatedIcon from 'components/AnimatedIcons/AnimatedIcons';
import React from 'react';

// ==============================|| NAV ICON ||============================== //

const NavIcon = ({ items }) => {
  let navIcons = false;
  const iconStyle = {
    textShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
  };

  if (items.icon) {
    navIcons = (
      <span className="pcoded-micon" style={iconStyle}>
        {/* <i className={items.icon} /> */}
        <AnimatedIcon
          iconId={items.icon}
          size={20}
          trigger="click"
          colors="primary:#ffffff"
          isHovered={items.isHovered}
        />

      </span>
    );
  }

  return <React.Fragment>{navIcons}</React.Fragment>;
};

export default NavIcon;
