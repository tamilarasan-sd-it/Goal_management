import { Box } from "@mui/material";

import LeftPanel from "../components/Login/LeftPanel";
import LoginCard from "../components/Login/LoginCard";

const Login = () => {

    return (

        <Box
            sx={{
                width: "100%",
                height: "100vh",
                display: "flex",
                overflow: "hidden",
                background:
                    "linear-gradient(135deg,#0F172A 0%,#1E3A8A 40%,#2563EB 100%)",
            }}
        >

            <LeftPanel />

            <LoginCard />

        </Box>

    );

};

export default Login;