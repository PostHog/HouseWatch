// ==============================|| OVERRIDES - BADGE ||============================== //

export default function Badge(theme: any) {
    return {
        MuiBadge: {
            styleOverrides: {
                standard: {
                    minWidth: theme.spacing(2),
                    height: theme.spacing(2),
                    padding: theme.spacing(0.5)
                }
            }
        }
    };
}
