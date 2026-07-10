import { Paper, Typography } from "@mui/material";

export default function StatCard({

title,

value,

icon,

color="#2563EB"

}){

return(

<Paper

sx={{

p:3,

borderRadius:5,

boxShadow:

"0 10px 30px rgba(37,99,235,.12)",

textAlign:"center"

}}

>

{icon}

<Typography

fontSize={32}

fontWeight={800}

color={color}

>

{value}

</Typography>

<Typography>

{title}

</Typography>

</Paper>

);

}