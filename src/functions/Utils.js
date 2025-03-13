module.exports = class Utils {
    /**
     * Generates a version 4 UUID prefixed for VunshDB.
     * This function creates a random UUID used specifically by VunshDB, ensuring that the generated UUID
     * follows the version 4 format with a 'vdb' prefix.
     *
     * @returns {string} A randomly generated UUID with the VDB prefix.
     */
    static createUUID() {
        return 'vdb:xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Validates whether a given string is a valid VunshDB UUID.
     * This function checks if the provided UUID matches the VunshDB version 4 UUID format (e.g., vdb:xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx).
     * It does so by using a regular expression tailored to the VunshDB UUID format.
     *
     * @param {string} uuid The UUID string to validate.
     * @returns {boolean} `true` if the string is a valid VunshDB UUID, otherwise `false`.
     */
    static isUUID(uuid) {
        const uuidRegex = /^vdb:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
};

/* Developed by hatebeingsobercereal on Discord :: last updated 3/9/25 */