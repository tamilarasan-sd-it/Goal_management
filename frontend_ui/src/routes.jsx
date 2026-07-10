import React, { Suspense, Fragment, lazy } from 'react';
import { Routes, Navigate, Route } from 'react-router-dom';


import { BASE_URL } from './config/constant';

import AuthGuard from './components/Guards/authGaurd';
import Role_Gaurd from './components/Guards/Role_Gaurd';


import { Login, Category, AdminLayout, Dashboard, template_columns, AddGoals, Template, GoalReviewer, GoalReviewerById, GoalViewPage,GoalViewPageById, CreateAssignment, ViewAssignments, GoalHistoryViewPage, MonthlyUpdates, MonthlyUpdateReport, ViewGoals, EmployeeDetailsView, TemplateDetails, MonthlySchedulerManagement, MonthlySchedulerAnalytics, ScheduleCalls , SubGoalsHistory,ViewAssignmentsList,ViewTemplateList} from './lazyImports';
import Loader from './components/Loader/Loader';



// ==============================|| ROUTES ||============================== //

const renderRoutes = (routes = []) => (
  <Suspense fallback={<Loader />}>
    <Routes>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Element = route.element;

        return (
          <Route
            key={i}
            path={route.path}
            exact={route.exact}
            element={
              <Guard>
                <Layout>{route.routes ? renderRoutes(route.routes) : <Element props={true} />}</Layout>
              </Guard>
            }
          />
        );
      })}
    </Routes>
  </Suspense>
);

export const routes = [
  {
    exact: 'true',
    path: '/login',
    guard: AuthGuard,
    element: Login
  },
  {
    path: '*',
    layout: AdminLayout,
    guard: Role_Gaurd,
    routes: [
      // {
      //   exact: 'true',
      //   path: '/',
      //   element: Dashboard
      // },
      {
        exact: 'true',
        path: '/add-category',
        element: Category
      },
      {
        exact: 'true',
        path: '/add-fields',
        element: template_columns
      },
      {
        exact: 'true',
        path: '/add-template',
        element: Template
      },
      // ============================================================================
      // GOAL MANAGEMENT (Goal Owner)
      // UPDATED: Now uses assignmentId instead of templateId
      // ============================================================================
      {
        exact: 'true',
        path: '/add-goals/:assignmentId',  // CHANGED: from /add-goals/:templateId
        element: AddGoals
      },
      {
        exact: 'true',
        path: '/edit-goals/:assignmentId',  // CHANGED: from /edit-goals/:templateId
        element: AddGoals
      },
      {
        exact: 'true',
        path: '/goal-reviews',
        element: GoalReviewer
      },
      {
        exact: 'true',
        path: '/goal-reviews-by-id/:id',
        element: GoalReviewerById
      },
      /*  {
        exact: 'true',
        path:'/goal-views',
        element:GoalViewPage
      },  */
      
      {
        exact: 'true',
        path:'/goal-views/:id',
        element:GoalViewPageById
      },
      {
        exact: 'true',
        path: '/sub-goal-history/:id',
        element: SubGoalsHistory
      },
      {
        exact: 'true',
        path: '/create-goal-settings',
        element: CreateAssignment
      },
      {
        exact: 'true',
        path: '/goal-settings',
        element: ViewAssignments
      },
      {
        exact: 'true',
        path: '/goal-settings-list/:id',
        element: ViewAssignmentsList
      },
      {
        exact: 'true',  
        path: '/monthly-updates',
        element: MonthlyUpdates
      },
      {
        exact: 'true',
        path: '/monthly-updates/report',
        element: MonthlyUpdateReport
      },
      {
        exact: 'true',
        path: '/monthly-update-details/:employeeId/:month/:year',
        element: EmployeeDetailsView,
        // For admins to drill down into individual employee details
      },
      {
        exact: 'true',
        path: '/view-goals',
        element: ViewGoals
      },
      {
        exact: 'true',
        path: '/goal-history/:id',
        element: GoalHistoryViewPage
      },
        {
        exact: 'true',
        path: '/template-details',
        element: TemplateDetails
      },
      {
        exact: 'true',
        path: '/monthly-scheduler',  // ✅ CHANGED: from /monthly-scheduler-management
        element: MonthlySchedulerManagement
      },
      {
        exact: 'true',
        path: '/monthly-scheduler-analytics/:schedulerId',  // ✅ CHANGED: added /:schedulerId param
        element: MonthlySchedulerAnalytics
      },
      {
        exact: 'true',
        path: '/schedule-calls',
         element: ScheduleCalls
      },
      {
        exact: 'true',
        path: '/template-list',
        element: ViewTemplateList
      },
      {
        exact: 'true',
        path:'/goallist-views/:id',
        element: GoalViewPage
      },
    ]
  }
];

export default renderRoutes;
