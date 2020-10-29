class Roles {
    /**
     * Constructeur
     * @param opt
     */
    constructor(opt) {
        this.logger = opt.logger;
    }

    // Grip
    grip(action, guild, member, rolesIds, emojiName) {
        let roles = {
            "claw": guild.roles.cache.get(rolesIds.claw),
            "x": guild.roles.cache.get(rolesIds.x),
            "y": guild.roles.cache.get(rolesIds.y),
            "b": guild.roles.cache.get(rolesIds.b),
            "v": guild.roles.cache.get(rolesIds.v),
            "s": guild.roles.cache.get(rolesIds.s),
            "palm": guild.roles.cache.get(rolesIds.palm),
            "k": guild.roles.cache.get(rolesIds.k),
            "c": guild.roles.cache.get(rolesIds.c),
            "f": guild.roles.cache.get(rolesIds.f),
            "default": guild.roles.cache.get(rolesIds.default),
            "o": guild.roles.cache.get(rolesIds.o),
            "r": guild.roles.cache.get(rolesIds.r),
            "ex": guild.roles.cache.get(rolesIds.ex),
            "rk": guild.roles.cache.get(rolesIds.rk),
            "bk": guild.roles.cache.get(rolesIds.bk),
            "mn": guild.roles.cache.get(rolesIds.mn),
            "d": guild.roles.cache.get(rolesIds.d),
            "saber_config": guild.roles.cache.get(rolesIds.saber_config),
            "custom": guild.roles.cache.get(rolesIds.custom)
        }

        switch (emojiName){
            case "🇦":
                this.addOrRemove(action, member, roles.claw, "Grip")
                break;
            case "🇧":
                this.addOrRemove(action, member, roles.x, "Grip")
                break;
            case "🇨":
                this.addOrRemove(action, member, roles.y, "Grip")
                break;
            case "🇩":
                this.addOrRemove(action, member, roles.b, "Grip")
                break;
            case "🇪":
                this.addOrRemove(action, member, roles.v, "Grip")
                break;
            case "🇫":
                this.addOrRemove(action, member, roles.s, "Grip")
                break;
            case "🇬":
                this.addOrRemove(action, member, roles.palm, "Grip")
                break;
            case "🇭":
                this.addOrRemove(action, member, roles.k, "Grip")
                break;
            case "🇮":
                this.addOrRemove(action, member, roles.c, "Grip")
                break;
            case "🇯":
                this.addOrRemove(action, member, roles.f, "Grip")
                break;
            case "🇰":
                this.addOrRemove(action, member, roles.default, "Grip")
                break;
            case "🇱":
                this.addOrRemove(action, member, roles.o, "Grip")
                break;
            case "🇲":
                this.addOrRemove(action, member, roles.r, "Grip")
                break;
            case "🇳":
                this.addOrRemove(action, member, roles.ex, "Grip")
                break;
            case "🇴":
                this.addOrRemove(action, member, roles.rk, "Grip")
                break;
            case "🇵":
                this.addOrRemove(action, member, roles.bk, "Grip")
                break;
            case "🇶":
                this.addOrRemove(action, member, roles.mn, "Grip")
                break;
            case "🇷":
                this.addOrRemove(action, member, roles.d, "Grip")
                break;
            case "🇸":
                this.addOrRemove(action, member, roles.saber_config, "Grip")
                break;
            case "🇹":
                this.addOrRemove(action, member, roles.custom, "Grip")
                break;
        }
    }

    // Global Function, do not call it in other files
    addOrRemove(action, member, role, origin) {
        if(action === "MESSAGE_REACTION_ADD") {
            this.logger.log('[ROLES](' + origin + ') Add "' + role.name + '" to "' + member.user.username + '"')
            member.roles.add(role)
        } else {
            this.logger.log('[ROLES](' + origin + ') Remove "' + role.name + '" from "' + member.user.username + '"')
            member.roles.remove(role)
        }
    }
}

module.exports = Roles;