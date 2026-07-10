import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// react-bootstrap
import { ListGroup } from 'react-bootstrap';

// project import
import NavItem from '../NavItem';
import LoopNavCollapse from './index';
import NavIcon from '../NavIcon';
import NavBadge from '../NavBadge';
import * as actionType from '../../../../../StoreRedux/constants/actionTypes';
import { useDispatch, useSelector } from 'react-redux';

// ==============================|| NAV COLLAPSE ||============================== //

const NavCollapse = ({ collapse, type }) => {
  const [isHovered, setIsHovered] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();

  const { layout, isOpen, isTrigger } = useSelector((state) => state.layout)

  useEffect(() => {
    const currentIndex = location.pathname
      .toString()
      .split('/')
      .findIndex((id) => id === collapse.id);
    if (currentIndex > -1) {
      dispatch({ type: actionType.COLLAPSE_TOGGLE, menu: { id: collapse.id, type: type } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapse, dispatch, type]);

  let navItems = '';
  if (collapse.children) {
    const collapses = collapse.children;
    navItems = Object.keys(collapses).map((item) => {
      item = collapses[item];
      switch (item.type) {
        case 'collapse':
          return <LoopNavCollapse key={item.id} collapse={item} type="sub" />;
        case 'item':
          return <NavItem layout={layout} key={item.id} item={item} />;
        default:
          return false;
      }
    });
  }

  let itemTitle = collapse.title;
  if (collapse.icon) {
    itemTitle = <span className="pcoded-mtext">{collapse.title}</span>;
  }

  let navLinkClass = ['nav-link'];

  let navItemClass = ['nav-item', 'pcoded-hasmenu'];
  const openIndex = isOpen.findIndex((id) => id === collapse.id);
  if (openIndex > -1) {
    navItemClass = [...navItemClass, 'active'];
  }

  const triggerIndex = isTrigger.findIndex((id) => id === collapse.id);
  if (triggerIndex > -1) {
    navItemClass = [...navItemClass, 'pcoded-trigger'];
  }

  const currentIndex = location.pathname
    .toString()
    .split('/')
    .findIndex((id) => id === collapse.id);
  if (currentIndex > -1) {
    navItemClass = [...navItemClass, 'active'];
    if (layout !== 'horizontal') {
      navLinkClass = [...navLinkClass, 'active'];
    }
  }

  const subContent = (
    <React.Fragment>
      <Link
        className={navLinkClass.join(' ')}
        onClick={(event) => {
          event.preventDefault();
          dispatch({ type: actionType.COLLAPSE_TOGGLE, menu: { id: collapse.id, type: type } })
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <NavIcon items={{ ...collapse, isHovered }} />
        {itemTitle}
        <NavBadge items={collapse} />
      </Link>
      <ListGroup variant="flush" bsPrefix=" " as="ul" className="pcoded-submenu">
        {navItems}
      </ListGroup>
    </React.Fragment >
  );

  let mainContent = '';
  mainContent = (
    <ListGroup.Item as="li" bsPrefix=" " className={navItemClass.join(' ')}>
      {subContent}
    </ListGroup.Item>
  );

  return <React.Fragment>{mainContent}</React.Fragment>;
};

export default NavCollapse;
