import { Box, Typography } from "@mui/material";

export default function AppHeader({

icon,

title,

subtitle,

action

}){

return(

<Box

sx={{

display:"flex",

justifyContent:"space-between",

alignItems:"center",

mb:3

}}

>

<Box

sx={{

display:"flex",

alignItems:"center",

gap:2

}}

>

{icon}

<Box>

<Typography

variant="h4"

fontWeight={800}

>

{title}

</Typography>

<Typography

color="text.secondary"

>

{subtitle}

</Typography>

</Box>

</Box>

{action}

</Box>

);

}