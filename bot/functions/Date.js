function treatDuration(duration) {
    let unit = duration.charAt(duration.length - 1).toUpperCase()
    let time = parseInt(duration.slice(0, -1))
    let date = new Date()

    switch (unit) {
        case "S":
            date.setSeconds(date.getSeconds() + time)
            break;
        case "I":
            date.setSeconds(date.getSeconds() + (time * 60))
            break;
        case "H":
            date.setSeconds(date.getSeconds() + (time * 60 * 60))
            break;
        case "D":
            date.setSeconds(date.getSeconds() + (time * 24 * 60 * 60))
            break;
        case "W":
            date.setSeconds(date.getSeconds() + (time * 7 * 24 * 60 * 60))
            break;
        case "M":
            date.setSeconds(date.getSeconds() + (time * 30 * 24 * 60 * 60))
            break;
        case "Y":
            date.setSeconds(date.getSeconds() + (time * 365 * 24 * 60 * 60))
            break;
        default:
            return false
    }

    if(date.toString().toLowerCase() === "invalid date")
        return false

    return date
}

module.exports = { treatDuration }