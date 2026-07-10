// reducer.js
import * as ActionTypes from '../constants/actionTypes';
const initialState = {
    pages: {
        dashboard: {
            loading: {
                DashboardLoad: false,
                ReviewerDashboardCountLoad: false,
                TemplateDetailsLoad: false,
            },
            data: {
                DashboardData: [],
                ReviewerDashboardCountData: [],
                TemplateDetailsCount: [],
            },
        },

        category: {
            loading: {
                categoryLoad: false,
            },
            data: {
                CategoryData: []
            },
        },
        columns: {
            loading: {
                ColumnsLoad: false,
            },
            data: {
                ColumnsData: []
            },
        },
        templates: {
            loading: {
                TemplatesLoad: false,
                TemplateDetailsLoad: false,
            },
            data: {
                TemplateDetailsData: [],
                TemplatesData: []
            },
        },
        employees: {
            loading: {
                PositionsLoad: false,
                EmployeesByPositionLoad: false,
                EmployeeByEmployeeIdLoad: false,
                EmployeesLoad: false,
            },
            data: {
                PositionsData: ['Senior Manager', 'Assistant Manager'],
                EmployeesByPositionData: [],
                EmployeeByEmployeeIdData: [],
                AllEmployeesData: [],
            },
        },
        goalReviewer: {
            loading: {
                GoalReviewerLoad: false,
                GoalTemplateDataForReviwerLoad: false,
                SubGoalReviewerLoad: false,
            },
            data: {
                GoalReviewerData: [],
                GoalTemplateDataForReviwerData: [],
                SubGoalReviewerData: [],
            },
        },
        goalReviewerByIdList: {
            loading: {
                GoalReviewerByIdListLoad: false,
                GoalReviewerByIdListColumnsLoad: false,
            },
            data: {
                GoalReviewerByIdListData: [],
                GoalReviewerByIdListColumnsData: [],
            },
        },
        assignments: {
            loading: {
                AssignmentsLoad: false,
                AssignmentsDataListLoad: false,
            },
            data: {
                AssignmentsData: [],
                AssignmentsDataList: [],
            },

        },
        templatelist: {
            loading: {
                TemplateListLoad: false,
                TemplateListDataLoad: false,
            },
            data: {
                TemplateListData: [],
                TemplateListDataList: [],
            },

        },
        
        // UPDATED: Assignment-based goal management
        add_new_goal: {
            loading: {
                getAssignmentLoad: false,  // Changed from getTemplateLoad
                getGoalsLoad: false,
                getDeptEmployeesLoad: false,
                addNewGoalLoad: false,
                submitLoad: false,
                draftLoad: false
            },
            data: {
                GetAssignmentData: null,  // Changed from GetTemplateData
                GetGoalsData: [],
                GetDepartmentEmployees: []
            }
        },
        goal_view_page: {
            loading: {
                GoalViewPageLoad: false,
                GoalViewPageByIdLoad: false,
                GoalDetailsByAssignmentLoad: false,
                GoalColumnsLoad: false,
                SubGoalViewPageLoad: false,
                GoalTemplateDataReviwerLoad: false
            },
            data: {
                GoalViewPageData: [],
                GoalViewPageByIdData: [],
                GoalDetailsByAssignmentData: [],
                GoalColumnsData: [],
                SubGoalViewPageData: [],
                GoalTemplateDataReviwerData: []
            },
        },
        monthly_updates: {
            loading: {
                monthlyGoalsLoad: false,
                saveUpdateLoad: false,
                submitUpdatesLoad: false,
                monthlyReportLoad: false,      // ✅ ADD
                employeeDetailsLoad: false,    // ✅ ADD
            },
            data: {
                MonthlyGoalsData: [],
                SaveMonthlyUpdate: null,
                SubmitMonthlyUpdates: null,
                MonthlyReportData: [],         // ✅ ADD
                EmployeeDetailsData: [],       // ✅ ADD
            }
        },
        monthly_update_report: {
            loading: {
                monthlyReportLoad: false,
                employeeDetailsLoad: false,
            },
            data: {
                MonthlyReportData: [],
                EmployeeDetailsData: [],
            }
        },
        view_goals: {
            loading: {
                goalsListLoad: false,
                filterOptionsLoad: false,
                summaryStatsLoad: false,
                goalDetailsLoad: false,
            },
            data: {
                GoalsListData: [],
                FilterOptionsData: {},
                SummaryStatsData: {},
                GoalDetailsData: null,
            }
        },
        monthly_scheduler: {
            loading: {
                schedulerLoad: false,
                schedulersLoad: false,
                sendNotificationsLoad: false,
                analyticsLoad: false,
                refreshAnalyticsLoad: false,
                generateReportsLoad: false,
                updateStatusLoad: false,
                notificationsLoad: false,
                markReadLoad: false,
            },
            data: {
                GetOrCreateScheduler: null,
                GetAllSchedulers: [],
                SendNotifications: null,
                GetAnalytics: null,
                RefreshAnalytics: null,
                GenerateReports: null,
                UpdateStatus: null,
                GetUserNotifications: null,
                MarkNotificationRead: null,
            }
        },
        goal_history_view_page: {
            loading: {
                GoalHistoryViewPageLoad: false,
                GoalHistoryReviewTemplateAssignmentsLoad: false,
            },
            data: {
                GoalHistoryViewPageData: [],
                GoalHistoryReviewTemplateAssignmentsData: [],
            },
        },
        schedule_calls: {
            loading: {
                scheduleCallLoad: false,
            },
            data: {
                ScheduleCallData: []
            }
        },
        sub_goal_history: {          // ✅ Must exist on init
            loading: {
                SubGoalHistoryByIdLoad: false,
            },
            data: {
                SubGoalHistoryByIdData: [],
            }
        }

    },
    error: null,
    message: null,
    AddSuccess: false, // this is for redirect specific action based
    UpdateSuccess: false, // this is for redirect specific action based 
    DeleteSuccess: false, // this is for redirect specific action based
    isPageNeedToRedirect: false, // this is for redirect specific action based
};

const CommonReducer = (state = initialState, action) => {
    switch (action.type) {
        case ActionTypes.SET_LOADING:
            return {
                ...state,
                pages: {
                    ...state.pages,
                    [action.page]: {
                        ...(state.pages[action.page] || { loading: {}, data: {} }),
                        loading: {
                            ...(state.pages[action.page]?.loading || {}),
                            [action.component]: action.payload,
                        },
                    },
                },
                // AddSuccess: false,
                // UpdateSuccess: false,
                // DeleteSuccess: false,
            };

        case ActionTypes.ADD_DATA: {
            const page = action.payload?.page;
            const component = action.payload?.component;
            const loadingKey = action.payload?.loading;
            const existingPage = state.pages[page] ?? { loading: {}, data: {} };

            return {
                ...state,
                pages: {
                    ...state.pages,
                    [page]: {
                        ...existingPage,
                        loading: {
                            ...existingPage.loading,
                            ...(loadingKey ? { [loadingKey]: false } : {}), // 👈 only set if key is a valid string
                        },
                        data: {
                            ...existingPage.data,
                            [component]: [
                                action.payload.data,
                                ...(existingPage.data[component] ?? []), // 👈 fallback to empty array
                            ],
                        },
                    },
                },
                AddSuccess: true,
            };
        }

        case ActionTypes.UPDATE_DATA: {
            const page = action.payload?.page;
            const component = action.payload?.component;
            const loadingKey = action.payload?.loading;
            const existingPage = state.pages[page] ?? { loading: {}, data: {} };

            return {
                ...state,
                pages: {
                    ...state.pages,
                    [page]: {
                        ...existingPage,
                        loading: {
                            ...existingPage.loading,
                            ...(loadingKey ? { [loadingKey]: false } : {}), // 👈 safe guard
                        },
                        data: {
                            ...existingPage.data,
                            [component]: (existingPage.data[component] ?? []).map(item =>
                                item[action.payload.idName] == action.payload.id
                                    ? { ...item, ...action.payload.updatedData }
                                    : item
                            ),
                        },
                    },
                },
                UpdateSuccess: true,
            };
        }

        case ActionTypes.DELETE_DATA: {
            const page = action.payload?.page;
            const component = action.payload?.component;
            const loadingKey = action.payload?.loading;
            const existingPage = state.pages[page] ?? { loading: {}, data: {} };

            return {
                ...state,
                pages: {
                    ...state.pages,
                    [page]: {
                        ...existingPage,
                        loading: {
                            ...existingPage.loading,
                            ...(loadingKey ? { [loadingKey]: false } : {}), // 👈 safe guard
                        },
                        data: {
                            ...existingPage.data,
                            [component]: (existingPage.data[component] ?? []).filter(item =>
                                item[action.payload.idName] !== action.payload.id
                            ),
                        },
                    },
                },
                DeleteSuccess: true,
            };
        }

        case ActionTypes.FETCH_DATA_SUCCESS: {
            const page = action.payload?.page;
            const component = action.payload?.component;
            const loadingKey = action.payload?.loading;
            const existingPage = state.pages[page] ?? { loading: {}, data: {} };

            return {
                ...state,
                pages: {
                    ...state.pages,
                    [page]: {
                        ...existingPage,
                        loading: {
                            ...existingPage.loading,
                            ...(loadingKey ? { [loadingKey]: false } : {}), // 👈 safe guard
                        },
                        data: {
                            ...existingPage.data,
                            [component]: action.payload.data.result,
                        },
                    },
                },
                AddSuccess: false,
                UpdateSuccess: false,
                DeleteSuccess: false,
                isPageNeedToRedirect: false,
            };
        }

        case ActionTypes.ERROR_ACTION: {
            const page = action.payload?.page;
            const loadingKey = action.payload?.loading;
            const existingPage = state.pages[page] ?? { loading: {}, data: {} };

            return {
                ...state,
                pages: {
                    ...state.pages,
                    [page]: {
                        ...existingPage,
                        loading: {
                            ...existingPage.loading,
                            ...(loadingKey ? { [loadingKey]: false } : {}), // 👈 safe guard
                        },
                    },
                },
            };
        }

        case ActionTypes.REDIRECT_ACTION:
            return {
                ...state,
                isPageNeedToRedirect: true,
            };

        default:

            const token = sessionStorage.getItem('token');
            const user = sessionStorage.getItem('user');
            if (token == null && user == null) {
                return state;
            }


            return state;
    }
};

export default CommonReducer;