import { toast } from "react-toastify";


const warning = (text) => {
    toast.warn(text, {
        position: "top-center",
        autoClose: 1000,
        closeButton:false,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",

    })
}

const Error = (text) => {
    toast.error(text, {
        position: "top-center",
        autoClose: 1000,
        closeButton:false,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
    })
}

const Success = (text) => {
    toast.success(text, {
        position: "top-center",
        autoClose: 1000,
        closeButton:false,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
    })
}


export { warning, Error, Success };

