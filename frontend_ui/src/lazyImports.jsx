import { lazy } from 'react';


export const Login = lazy(() => import('./pages/Login'));

export const Dashboard = lazy(() => import('./views/dashboard/dashboard.jsx'));

export const Category = lazy(() => import('./views/category/category'));
export const template_columns = lazy(() => import('./views/columns/columns'));
export const AddGoals = lazy(() => import('./views/add_new_goal/AddGoals.jsx'));

export const Template = lazy(() => import('./views/template/template.jsx'));
export const GoalReviewer = lazy(() => import('./views/goalReviewer/goalReviewer.jsx'));
export const GoalReviewerById = lazy(() => import('./views/goalReviewer/goalReviewerById.jsx'));

export const GoalViewPage = lazy(() => import('./views/goalViews/goalViewPage.jsx'));
export const GoalViewPageById = lazy(() => import('./views/goalViews/GoalViewPageById.jsx'));
export const SubGoalsHistory = lazy(() => import('./views/subGoalsHistory/subGoalsHistory.jsx'));

export const CreateAssignment = lazy(() => import('./views/createAssignment/createAssignment.jsx'));
export const ViewAssignments = lazy(() => import('./views/viewAssignments/viewAssignments.jsx'));
export const ViewAssignmentsList = lazy(() => import('./views/viewAssignments/viewAssignmentsList.jsx'));
export const GoalHistoryViewPage = lazy(() => import('./views/goalHistoryList/GoalHistoryList.jsx'));

export const TemplateDetails = lazy(() => import('./views/dashboard/templateDetails.jsx'));
export const ScheduleCalls = lazy(() => import('./views/scheduleCalls/ScheduleCalls.jsx'));

export const ViewTemplateList = lazy(() => import('./views/templatelist/TemplateList.jsx'));

export const MonthlyUpdates = lazy(() => 
    import('./views/monthlyUpdates/MonthlyUpdates.jsx')
);
export const MonthlyUpdateReport = lazy(() => 
    import('./views/monthlyUpdates/MonthlyUpdateReport.jsx')
);

export const EmployeeDetailsView = lazy(() => 
    import('./views/monthlyUpdates/EmployeeDetailsView.jsx')
);

export const ViewGoals = lazy(() => import('./views/viewGoals/ViewGoals.jsx'));



// ✅ Monthly Scheduler (Super Admin - Frontend Controlled)
export const MonthlySchedulerManagement = lazy(() => import('./views/monthlyScheduler/MonthlySchedulerManagement'));
export const MonthlySchedulerAnalytics = lazy(() => import('./views/monthlyScheduler/MonthlySchedulerAnalytics'));

// export const AdminLayout = lazy(() => import('./components/layout/AdminLayout.jsx'));
export const AdminLayout = lazy(() => import('./layout/AdminLayout/index.jsx'));
export const Sidebar = lazy(() => import('./layout/Sidebar.jsx'));


//AdminLayout 
export const Navigation = lazy(() => import('./layout/AdminLayout/Navigation/index'));
export const NavBar = lazy(() => import('./layout/AdminLayout/NavBar/index'));
export const Breadcrumb = lazy(() => import('./layout/AdminLayout/Breadcrumb/index'));
