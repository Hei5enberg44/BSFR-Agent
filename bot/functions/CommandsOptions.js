function getBanOrMuteOptions() {
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

function getAddOrRemoveOptions(add = false) {
    return {
        "subject": {
            "name": "sujet",
            "type": "string",
            "description": "Sujet",
            "required": true,
            "choices": [
                { displayName: "Mots à bannir", name: "bannedWords" },
                { displayName: "Message d'anniversaire", name: "birthdayMessages" }
            ]
        },
        "message": {
            "name": add ? "texte" : "ids",
            "type": "string",
            "description": "/!\\ " + (add ? "(Mots bannis uniquement) " : "") + "Si il y a plusieurs " + (add ? "mots" : "IDs") + ", merci de les séparer par un point virgule /!\\",
            "required": true
        }
    }
}

module.exports = { getBanOrMuteOptions, getAddOrRemoveOptions }