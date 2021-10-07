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

function isValid(date) {
    const regex = new RegExp('^(((0[1-9]|[12]\\d|3[01])\\/(0[13578]|1[02])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|[12]\\d|30)\\/(0[13456789]|1[012])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|1\\d|2[0-8])\\/02\\/((19|[2-9]\\d)\\d{2}))|(29\\/02\\/((1[6-9]|[2-9]\\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$')

    return regex.test(date);
}

module.exports = { treatDuration, isValid }