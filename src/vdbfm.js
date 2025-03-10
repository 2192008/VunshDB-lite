const path = require("path");
const fs = require("fs");

class VDBFileManager {
    /**
     * The path where database files are stored.
     * 
     * This static property resolves the absolute path to the dbs directory, which is used to store
     * all database files. The path is relative to the current file's directory.
     * 
     * @type {string} - The absolute path to the dbs directory.
    */
    static dbPath = path.resolve(__dirname, "../dbs");

    /**
     * Validates the existence of the database path. If the path does not exist, it creates it.
     * 
     * This method checks if the database directory exists. If not, it attempts to create the directory.
     * 
     * @throws {Error} - Throws an error if the directory cannot be created or validated.
     * 
     * @returns {Promise<boolean>} - Returns true if the path exists or was successfully created.
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
            throw new Error(`[VunshDB] Couldn't validate dbPath ${e.message}`);
        }
    }

    /**
     * Creates a new database file with the specified name.
     * 
     * This method checks if the database file already exists. If it does not exist, it creates the file
     * with an empty array `[]` as its initial content.
     * 
     * @param {string} name - The name of the database file to create.
     * @throws {Error} - Throws an error if the database file already exists.
     * 
     * @returns {Promise<boolean>} - This method does not return any value but creates a new db file.
    */
    static async createDbFile(name) {
        const filePath = path.join(this.dbPath, `${name}.vunsh.db`);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]));
        } else {
            throw new Error(`[VunshDB] Database file ${filePath} already exists.`);
        }
    }

    /**
     * Retrieves the database file path for the specified name.
     * 
     * This method checks if the database file exists. If it does not exist, it will call `createDbFile()` 
     * to create the file. It returns the file path of the database.
     * 
     * @param {string} name - The name of the database file to retrieve (without the `.vunsh.db` extension).
     * @throws {Error} - Throws an error if the database file cannot be created or retrieved.
     * 
     * @returns {Promise<string>} - Returns the file path of the db file.
    */
    static async getDbFile(name) {
        const filePath = path.join(VDBFileManager.dbPath, `${name}.vunsh.db`);
        if (!fs.existsSync(filePath)) await VDBFileManager.createDbFile(name);
        return filePath;
    }

    /**
     * Fetches a collection based on the given enum name.
     * 
     * @param {("ci" | "ti" | "cr")} name - The enum for the collection.
     * Valid enums:
     * - ci: Current Interactions
     * - ti: Total Interactions
     * - cr: Current Runtime
     * 
     * ! Update Soon
     * 
     * @returns {Promise<number>} - Returns the value of the collection field.
     * @throws {Error} - Throws an error if the name is invalid or the collection file is missing or malformed.
    */
    static async getCollection(name) {
        const fileNameMap = {
            ci: "cinteractions.json",
            ti: "totalinteractions.json",
            cr: "cruntime.json"
        };

        // Check if the provided name is valid
        if (!fileNameMap[name]) {
            throw new Error(`[VunshDB] getCollection() Expected enum, received ${name}. Valid enums:\nci (Current Interactions),\nti (Total Interactions),\ncr (Current Runtime)`);
        }

        // Get the full file path
        const collectionPath = path.join(path.resolve(__dirname, "../cltns"), fileNameMap[name]);

        // Check if the collection file exists
        if (!fs.existsSync(collectionPath)) {
            throw new Error(`[VunshDB] Collection file ${collectionPath} not found.`);
        }

        // Read the file and parse the JSON content
        const fileContent = fs.readFileSync(collectionPath, "utf-8");
        const collectionData = JSON.parse(fileContent);

        // Return the collection field (or handle the case if it doesn't exist)
        if (collectionData && collectionData.hasOwnProperty("collection")) {
            return collectionData.collection; // Return the collection field value
        } else {
            throw new Error(`[VunshDB] 'collection' field not found in ${collectionPath}.`);
        }
    }

    /**
     * Updates a collection with a new value. (For automatic update only)
     * 
     * This method retrieves the collection based on the provided name, then updates the `collection` field 
     * by adding or updating the value.
     * 
     * @param {("ci" | "ti" | "cr")} name - The enum for the collection to update.
     * @param {number} value - The value to update the collection with (e.g., increment or set).
     * 
     * @returns {Promise<boolean>} - Returns true if the update was successful.
     * @throws {Error} - Throws an error if the collection file is not found or invalid.
    */
    static async updateCollectionDev(name, value) {
        const fileNameMap = {
            ci: "cinteractions.json",
            ti: "totalinteractions.json",
            cr: "cruntime.json"
        };

        if (!fileNameMap[name]) {
            throw new Error(`[VunshDB] updateCollection() Expected enum, received ${name}. Valid enums:\nci (Current Interactions),\nti (Total Interactions),\ncr (Current Runtime)`);
        }

        // Get the full file path
        const collectionPath = path.join(path.resolve(__dirname, "../cltns"), fileNameMap[name]);

        // Check if the collection file exists
        if (!fs.existsSync(collectionPath)) {
            throw new Error(`[VunshDB] Collection file ${collectionPath} not found.`);
        }

        // Read the file and parse the JSON content
        const fileContent = fs.readFileSync(collectionPath, "utf-8");
        const collectionData = JSON.parse(fileContent);

        // Ensure the collection field exists
        if (!collectionData || !collectionData.hasOwnProperty("collection")) {
            throw new Error(`[VunshDB] 'collection' field not found in ${collectionPath}.`);
        }

        // Update the collection value
        collectionData.collection = value;

        // Write the updated collection data back to the file
        try {
            fs.writeFileSync(collectionPath, JSON.stringify(collectionData, null, 2)); // Pretty print the JSON
            return true;
        } catch (e) {
            throw new Error(`[VunshDB] Error writing to collection file ${collectionPath}: ${e.message}`);
        }
    }
}

module.exports = {
    VDBFileManager,
    createDbFile: VDBFileManager.createDbFile,
    getDbFile: VDBFileManager.getDbFile,
    getCollection: VDBFileManager.getCollection,
    updateCollectionDev: VDBFileManager.updateCollectionDev,
};

/* Created by hatebeingsobercereal on Discord :: last updated 3/10/25 */