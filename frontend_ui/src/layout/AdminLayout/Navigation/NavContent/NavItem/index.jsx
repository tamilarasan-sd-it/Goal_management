import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ListGroup } from 'react-bootstrap';
import NavIcon from '../NavIcon';
import NavBadge from '../NavBadge';
import * as actionType from '../../../../../StoreRedux/constants/actionTypes';
import useWindowSize from '../../../../../hooks/useWindowSize';
import { useDispatch } from 'react-redux';

// ==============================|| NAV ITEM ||============================== //

const NavItem = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    const windowSize = useWindowSize();
    const dispatch = useDispatch();
    const shadowStyle = {
        textShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
    };

    const itemStyle = {
        borderRadius: '0 150px 100px 0',
        overflow: 'hidden',
    };

    let itemTitle = (
        <span className="pcoded-mtext" style={shadowStyle}>
            {item.title}
        </span>
    );

    let itemTarget = item.target ? '_blank' : '';

    let subContent;
    if (item.external) {
        subContent = (
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <NavIcon items={{ ...item, isHovered }} />
                {itemTitle}
                <NavBadge items={item} />
            </a>
        );
    } else {
        subContent = (
            <NavLink
                to={item.url}
                className="nav-link"
                exact="true"
                target={itemTarget}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <NavIcon items={{ ...item, isHovered }} />
                {itemTitle}
                <NavBadge items={item} />
            </NavLink>
        );
    }

    let mainContent = (
        <ListGroup.Item
            as="li"
            bsPrefix=" "
            className={item.classes}
            style={itemStyle}
            onClick={windowSize.width < 992 ? () => dispatch({ type: actionType.COLLAPSE_MENU }) : undefined}
        >
            {subContent}
        </ListGroup.Item>
    );

    return <React.Fragment>{mainContent}</React.Fragment>;
};

export default NavItem;
