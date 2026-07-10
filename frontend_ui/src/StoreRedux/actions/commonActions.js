import { apiAction } from "../../StoreRedux/constants/actionTypes";

//fetch action
export const fetchAction = (contentType, page, component, loading) => {

    const config = {
        url: `${import.meta.env.VITE_BASE_URL}/${page}/${component}/fetch`,
        method: 'GET',
        data: null,
        label: { page, component, loading },
        params: { page: page, component: component, loading: loading },
        actionType: 'fetch',
        contentType: contentType
    }
    return apiAction(config);
};

export const fetchByIdAction = (contentType, page, component, loading, id) => {
    

    const config = {
        url: `${import.meta.env.VITE_BASE_URL}/${page}/${component}/fetch`,
        method: 'GET',
        data: null,
        label: { page, component, loading },
        // params: { page: page, component: component, id: id },
        params: { page: page, component: component, loading: loading, id: typeof id === 'object' && id !== null ? JSON.stringify(id) : id },  // ✅ Complete!

        actionType: 'fetch',
        contentType: contentType
    }
    return apiAction(config);
};

//add actions

export const addAction = (contentType, page, component, loading, data) => {
    const config = {
        url: `${import.meta.env.VITE_BASE_URL}/${page}/${component}/create`,
        method: 'POST',
        data: data,
        label: { page, component, loading },
        params: { page: page, component: component, loading: loading },
        actionType: 'add',
        contentType: contentType
    }
    return apiAction(config);
};

// Update Actions

export const updateAction = (contentType, page, component, loading, slug, data) => {
    const config = {
        url: `${import.meta.env.VITE_BASE_URL}/${page}/${component}/${slug}/update`,
        method: 'PUT',
        data: data,
        label: { page, component, loading },
        params: { page: page, component: component, loading: loading },
        actionType: 'update',
        contentType: contentType
    }
    return apiAction(config);
};

//delete actions
export const deleteAction = (contentType, page, component, loading, data) => {
    const config = {
        url: `${import.meta.env.VITE_BASE_URL}/${page}/${component}/delete`,
        method: 'PUT',
        data: data,
        label: { page, component, loading },
        params: { page: page, component: component, loading: loading },
        actionType: 'delete',
        contentType: contentType
    }
    return apiAction(config);
};
