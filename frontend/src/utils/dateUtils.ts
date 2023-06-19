
const monthNames = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"
]

export function isoTimestampToHumanReadable(isoDate: string): string {
    const date = new Date(isoDate)

    // no need to display the year if it's this year
    const year = new Date().getFullYear() === date.getFullYear() ? '' : `, ${date.getFullYear()}`

    // Prepare the date format
    const formattedDate = monthNames[date.getMonth()] + ' '
        + date.getDate() 
        + year + ' '
        + ('0' + date.getHours()).slice(-2) + ':'
        + ('0' + date.getMinutes()).slice(-2)

    return formattedDate
}

