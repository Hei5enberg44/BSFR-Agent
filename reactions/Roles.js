class Roles {
    country(action, guild, member, rolesIds, emojiName) {
        let roles = {
            "france": guild.roles.cache.get(rolesIds.france),
            "english": guild.roles.cache.get(rolesIds.english)
        }

        switch (emojiName){
            case "🇫🇷":
                this.addOrRemove(action, member, roles.france)
                break;
            case "🇬🇧":
                this.addOrRemove(action, member, roles.english)
                break;
        }
    }

    addOrRemove(action, member, role) {
        if(action === "MESSAGE_REACTION_ADD") {
            member.roles.add(role)
        } else {
            member.roles.remove(role)
        }
    }
}

module.exports = Roles;