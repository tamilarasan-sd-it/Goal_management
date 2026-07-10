import React, { useEffect, useRef, Suspense } from 'react';

import useWindowSize from '../../hooks/useWindowSize';
import useOutsideClick from '../../hooks/useOutsideClick';
import * as actionType from '../../StoreRedux/constants/actionTypes';
import { useDispatch, useSelector } from 'react-redux';

import { Breadcrumb, NavBar, Navigation } from 'lazyImports';
import Auth_Middleware from "../../components/Guards/auth_Middleware";
import { Loader } from 'lucide-react';



// ==============================|| ADMIN LAYOUT ||============================== //

const AdminLayout = ({ children }) => {
  const windowSize = useWindowSize();
  const ref = useRef();

  const { collapseMenu, layout } = useSelector((state) => state.layout);
  const dispatch = useDispatch();

  useOutsideClick(ref, () => {
    if (collapseMenu) {
      dispatch({ type: actionType.COLLAPSE_MENU });
    }
  });

  useEffect(() => {
    if (windowSize.width > 992 && windowSize.width <= 1024) {
      dispatch({ type: actionType.COLLAPSE_MENU });
    }

    if (windowSize.width < 992) {
      dispatch({ type: actionType.CHANGE_LAYOUT, layout: 'vertical' });
    }
  }, [dispatch, layout, windowSize]);

  const mobileOutClickHandler = () => {
    if (windowSize.width < 992 && collapseMenu) {
      dispatch({ type: actionType.COLLAPSE_MENU });
    }
  };

  let mainClass = ['pcoded-wrapper'];

  let common = (
    <Suspense fallback={<Loader/>}>
      <Auth_Middleware>
        <Navigation />
        <NavBar />
      </Auth_Middleware>
    </Suspense>
  );

  if (windowSize.width < 992) {
    let outSideClass = ['nav-outside'];
    if (collapseMenu) {
      outSideClass.push('mob-backdrop');
    }
    outSideClass.push('mob-fixed');

    common = (
      <div className={outSideClass.join(' ')} ref={ref}>
        {common}
      </div>
    );
  }

  return (
    <Auth_Middleware>
      <React.Fragment>
        {common}
        <div className="pcoded-main-container" onClick={mobileOutClickHandler} onKeyDown={mobileOutClickHandler}>
          <div className={mainClass.join(' ')}>
            <div className="pcoded-content">
              <div className="pcoded-inner-content">
                <Suspense fallback={<div>Loading Breadcrumb...</div>}>
                  {/* <Breadcrumb /> */}
                </Suspense>
                {children}
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    </Auth_Middleware>
  );
};

export default AdminLayout;