import React from 'react';
import { useSelector } from 'react-redux';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { createSelector } from 'reselect';

const loaderTheme = createTheme({
    palette: {
        primary: {
            main: '#6366f1'
        }
    }
});

export default function MUILoader() {
    const [message, setMessage] = useState('Loading');
    const [dots, setDots] = useState('');

    const selectAllPageLoading = createSelector(
        state => state?.dataService?.pages,
        (pages) => {
            const result = {};
            const pageNames = Object.keys(pages);
            pageNames.forEach(page => {
                const pageData = pages?.[page];

                if (pageData) {
                    result[page] = pageData?.loading;
                }
            });
            return result;
        }
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 400);
        return () => clearInterval(interval);
    }, []);

    const Loading = useSelector(selectAllPageLoading);

    const open = Object.values(Loading).some(page =>
        page && Object.values(page).some(loadingState => loadingState === true)
    );

    return (
        <ThemeProvider theme={loaderTheme}>
            <Backdrop
                sx={{
                    color: '#fff',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: (theme) => theme.zIndex.drawer + 99,
                    flexDirection: 'column'
                }}
                open={open}
            >
                <CircularProgress color="primary" size={60} thickness={4} />
                <Typography
                    variant="h6"
                    sx={{ mt: 2, fontWeight: '600', letterSpacing: '0.5px' }}
                >
                    {message}{dots}
                </Typography>
            </Backdrop>
        </ThemeProvider>
    );
}


// const loaderTheme = createTheme({
//     palette: {
//         primary: {
//             main: '#ff4081',
//         },
//         secondary: {
//             main: '#3d5afe',
//         },
//     },
// });

// const useTypingEffect = (text, speed) => {
//     const [displayedText, setDisplayedText] = useState('');
//     const [index, setIndex] = useState(0);

//     useEffect(() => {
//         if (text.length === 0) return;

//         const typingInterval = setInterval(() => {
//             if (index < text.length) {
//                 setDisplayedText((prev) => prev + text.charAt(index));
//                 setIndex((prev) => prev + 1);
//             } else {
//                 setDisplayedText('');
//                 setIndex(0);
//             }
//         }, speed);

//         return () => clearInterval(typingInterval);
//     }, [text, speed, index]);

//     return displayedText;
// };

// export default function MUILoader() {
//     const userLoading = useSelector((state) => state.user.loading);
//     const authLoading = useSelector((state) => state.auth.loading);
//     const open = userLoading || authLoading;

//     const message = "Please wait, server is loading...";
//     const typingSpeed = 100;

//     const typedMessage = useTypingEffect(open ? message : '', typingSpeed);

//     return (
//         <ThemeProvider theme={loaderTheme}>
//             <Backdrop
//                 sx={{
//                     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//                     color: loaderTheme.palette.primary.contrastText,
//                     zIndex: (theme) => theme.zIndex.drawer + 1,
//                 }}
//                 open={open}
//             >
//                 <CircularProgress
//                     sx={{
//                         color: loaderTheme.palette.secondary.main,
//                         animation: 'spin 1s linear infinite',
//                     }}
//                     size={70}
//                 />
//                 <Typography
//                     variant="h6"
//                     sx={{
//                         marginTop: 2,
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         textShadow: '0px 0px 5px rgba(255, 255, 255, 0.8)',
//                         color: '#ffffff',
//                     }}
//                 >
//                     {typedMessage}
//                 </Typography>
//             </Backdrop>
//         </ThemeProvider>
//     );
// }
