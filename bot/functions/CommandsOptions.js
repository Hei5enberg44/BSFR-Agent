function getBanOrMuteOptions(ban) {
    return {
        "member": {
            "name": "membre",
            "type": "user",
            "description": "Membre",
            "required": true
        },
        "reason": {
            "name": "raison",
            "type": "string",
            "description": "Raison",
            "required": true
        },
        "duration": {
            "name": "durée",
            "type": "string",
            "description": "Durée (s = secondes / i = minutes / h = heures / d = jours / w = semaines / m = mois / y = année)",
            "required": true
        },
    }
}

module.exports = { getBanOrMuteOptions }