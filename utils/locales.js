import locales from './locales.json' assert { type: 'json' }

export default {
    /**
     * @param {string} locale
     * @param {string} string
     * @param {...any} subs
     * @returns {string}
     */
    get(locale, string, ...subs) {
        const localeStrings = locales[locale] ? locales[locale] : locales['en-US']
        if(localeStrings[string]) {
            let translatedString = localeStrings[string]
            for(const sub of subs) {
                translatedString = translatedString.replace('%s', sub)
            }
            return translatedString
        }
        return string
    }
}