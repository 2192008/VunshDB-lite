const path = require("path");
const fs = require("fs");

class VDBFileManager {

    static dbPath = path.resolve(__dirname, "../dbs");

    /**
     * Validates the database path. Creates the directory if it doesn't exist.
     * This is for internal use within the package and shouldn't be used externally.
     * @returns {Promise<boolean>} Returns true if the directory exists or is created.
     * @throws {Error} Throws an error if directory creation fails.
     */
    static async validateDbPath() {
        try {
            if (!fs.existsSync(this.dbPath)) {
                fs.mkdirSync(this.dbPath, { recursive: true }); // Ensures any subdirectories are created
                return true; // Return true when the directory is created
            } else {
                return true; // Return true if the directory already exists
            }
        } catch (e) {
            throw new Error(`[VunshDB] Couldn't validate dbPath ${e}`);
        }
    }

    /**
     * Creates a new database file if it doesn't already exist.
     * This function is for internal package use only and should not be called externally.
     * @param {string} name The name of the database to create.
     * @returns {Promise<void>} Resolves when the file is created.
     * @throws {Error} Throws an error if the file already exists.
     */
    static async createDbFile(name) {
        const resolvedName = VDBFileManager.resolveCollectionName(name);
        const filePath = path.join(this.dbPath, `${resolvedName}.vunsh.db`);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]));
        } else {
            throw new Error(`[VunshDB] Database file ${filePath} already exists.`);
        }
    }

    /**
     * Retrieves the path of a database file, creating it if necessary.
     * This function is for internal use within the package and shouldn't be called externally.
     * @param {string} name The name of the database to fetch.
     * @returns {Promise<string>} Resolves with the file path of the database.
     * @throws {Error} Throws an error if database retrieval fails.
     */
    static async getDbFile(name) {
        try {
            const resolvedName = VDBFileManager.resolveCollectionName(name);
            const filePath = path.join(VDBFileManager.dbPath, `${resolvedName}.vunsh.db`);
            if (!fs.existsSync(filePath)) await VDBFileManager.createDbFile(resolvedName);
            return filePath;
        } catch (e) {
            throw new Error(`[VunshDB] Couldn't fetch DB file\n${e}`)
        }
    }

    static cltnsPath = path.resolve(__dirname, "../cltns");

    /**
     * Validates and ensures collections are properly set up.
     * This is an internal development function and should not be called externally.
     * @returns {Promise<boolean>} Resolves to true if validation is successful.
     * @throws {Error} Throws an error if collection validation fails.
     */
    static async validateCltns() {
        try {
            const validCollections = ["runtime", "vdbsettings", "cinteractions", "tinteractions"];

            // Ensure this.cltnsPath is properly resolved
            if (this.cltnsPath instanceof Promise) {
                this.cltnsPath = await this.cltnsPath;
            }

            // Check if the collection path exists, create it if not
            if (!fs.existsSync(this.cltnsPath)) {
                fs.mkdirSync(this.cltnsPath, { recursive: true });
            }

            // Ensure each collection exists and is in the correct format
            for (const collection of validCollections) {
                const resolvedName = VDBFileManager.resolveCollectionName(collection);
                const filePath = path.join(this.cltnsPath, `${resolvedName}.json`);

                if (!fs.existsSync(filePath)) {
                    const defaultData = resolvedName === "vdbsettings"
                        ? { "$runtime": true, "$interactioncount": true }
                        : resolvedName === "cinteractions" || resolvedName === "tinteractions"
                            ? { "interactions": 0 }
                            : { "collection": 0 };  // For runtime
                    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 4));
                } else {
                    // Validate the collection's data format
                    const fileContent = fs.readFileSync(filePath, "utf-8");
                    let collectionData;
                    try {
                        collectionData = JSON.parse(fileContent);
                    } catch (e) {
                        // If the JSON is invalid, fix it
                        const defaultData = resolvedName === "vdbsettings"
                            ? { "$runtime": true, "$interactioncount": true }
                            : resolvedName === "cinteractions" || resolvedName === "tinteractions"
                                ? { "interactions": 0 }
                                : { "collection": 0 };  // For runtime
                        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 4));  // Fix the data
                        collectionData = defaultData;  // Use the fixed data
                    }

                    // Check if the collection data matches the expected structure
                    const defaultData = resolvedName === "vdbsettings"
                        ? { "$runtime": true, "$interactioncount": true }
                        : resolvedName === "cinteractions" || resolvedName === "tinteractions"
                            ? { "interactions": 0 }
                            : { "collection": 0 };  // For runtime

                    // Function to check if collection data matches the default structure
                    const isValidCollectionData = (data, defaultData) => {
                        return Object.keys(defaultData).every(key => data.hasOwnProperty(key));
                    };

                    // If the data structure is incorrect, fix it
                    if (!isValidCollectionData(collectionData, defaultData)) {
                        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 4));
                    }
                }
            }
            return true;
        } catch (e) {
            throw new Error(`[VunshDB] Couldn't validate collections\n${e}`);
        }
    }

    /**
     * Creates a collection with the specified name and data.
     * This function is for internal package use and should not be called externally.
     * @param {string} name The name of the collection to create.
     * @param {object} [data={}] The data to initialize the collection with.
     * @returns {Promise<boolean>} Resolves to true if the collection is created.
     * @throws {Error} Throws an error if collection creation fails.
     */
    static async createCollection(name, data = {}) {
        try {
            const resolvedName = VDBFileManager.resolveCollectionName(name);
            const collectionPath = path.join(this.cltnsPath, `${resolvedName}.json`);

            if (fs.existsSync(collectionPath)) {
                throw new Error(`[VunshDB] Collection ${resolvedName} already exists.`);
            }

            // Set default data for the collection if no data is provided
            const defaultData = resolvedName === "vdbsettings"
                ? { "$runtime": true, "$interactioncount": true }
                : resolvedName === "cinteractions" || resolvedName === "tinteractions"
                    ? { "collection": 0 }
                    : { "collection": 0 };  // For runtime

            // Merge provided data with the default data
            const collectionData = { ...defaultData, ...data };

            // Write the collection to the file
            fs.writeFileSync(collectionPath, JSON.stringify(collectionData, null, 4));
            return true;
        } catch (e) {
            throw new Error(`[VunshDB] Couldn't create collection ${name}\n${e}`);
        }
    }

    /**
     * Retrieves a collection by its name.
     * This function is for internal package use and should not be called externally.
     * @param {string} name The name of the collection to retrieve.
     * @returns {Promise<object>} Resolves with the collection data.
     * @throws {Error} Throws an error if the collection cannot be retrieved.
     */
    static async getCollection(name) {
        try {
            const resolvedName = VDBFileManager.resolveCollectionName(name);
            const collectionPath = path.join(path.resolve(__dirname, "../cltns"), `${resolvedName}.json`);

            if (!fs.existsSync(collectionPath)) {
                throw new Error(`[VunshDB] Collection ${resolvedName} not found.`);
            }

            const fileContent = fs.readFileSync(collectionPath, "utf-8");
            return JSON.parse(fileContent);
        } catch (e) {
            throw new Error(`[VunshDB] Couldn't retrieve collection ${name}\n${e}`);
        }
    }

    /**
     * Updates the data of an existing collection.
     * This function is for internal package use and should not be called externally.
     * @param {string} name The name of the collection to update.
     * @param {object} data The new data for the collection.
     * @returns {Promise<boolean>} Resolves to true if the collection is updated.
     * @throws {Error} Throws an error if the update fails.
     */
    static async updateCollection(name, data = {}) {
        try {
            if (typeof data !== 'object' || data === null) {
                throw new Error("[VunshDB] Invalid data format. Expected an object.");
            }

            const resolvedName = VDBFileManager.resolveCollectionName(name);
            const collectionPath = path.join(VDBFileManager.cltnsPath, `${resolvedName}.json`);

            if (!fs.existsSync(collectionPath)) {
                throw new Error(`[VunshDB] Collection ${resolvedName} not found.`);
            }

            fs.writeFileSync(collectionPath, JSON.stringify(data, null, 4)); // Indent for readability
            return true;
        } catch (e) {
            throw new Error(`[VunshDB] Couldn't update collection ${name}\n${e}`);
        }
    }

    /**
     * Resolves shorthand collection names to their full names.
     * This function is for internal use within the package.
     * @param {string} name The shorthand collection name.
     * @returns {string} The full collection name.
     */
    static resolveCollectionName(name) {
        const shorthandMapping = {
            "rt": "runtime",
            "vdbs": "vdbsettings",
            "ci": "cinteractions",
            "ti": "tinteractions"
        };
        return shorthandMapping[name] || name;
    };

}

module.exports = {
    VDBFileManager,
    getDbFile: VDBFileManager.getDbFile,
    getCollection: VDBFileManager.getCollection,
    updateCollection: VDBFileManager.updateCollection,
};
