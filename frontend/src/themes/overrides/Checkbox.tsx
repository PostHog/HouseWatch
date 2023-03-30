// ==============================|| OVERRIDES - CHECKBOX ||============================== //

export default function Checkbox(theme: any) {
    return {
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: theme.palette.secondary[300]
                }
            }
        }
    };
}
