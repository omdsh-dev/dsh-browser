export class DefaultIdentityProviderConfig {
    authSchemes = new Map();
    constructor(config) {
        for (const key in config) {
            const value = config[key];
            if (value !== undefined) {
                this.authSchemes.set(key, value);
            }
        }
    }
    getIdentityProvider(schemeId) {
        return this.authSchemes.get(schemeId);
    }
}
