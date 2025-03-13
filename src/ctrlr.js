const { createUUID } = require("./functions/Utils");
const { getDbFile, getCollection, updateCollection, VDBFileManager } = require("./vdbfm");
const fs = require("fs");

class VunshDB {

    /**
     * Initializes the VunshDB by validating the database and vdb collection paths, also resets 
     * "Current Runtime" (rt) & "Current Interactions" (ci) collections to 0, and starting an interval to update 
     * the "Current Runtime" collection every second.
     * 
     * @async
     * @function connect
     * 
     * @param {Object} [options={}] - The optional settings to control runtime and interaction counting.
     * @param {boolean} [options.$runTime=true] - Whether to track the runtime or not.
     * @param {boolean} [options.$interactionCounts=true] - Whether to count interactions or not.
     * 
     * @returns {Promise<Object>} The initialization result object.
     * @returns {boolean} returns.status - Status of the initialization (`true`).
     * @returns {number} returns.duration - Time taken for initialization (in seconds).
     * 
     * @throws {Error} If any error occurs during initialization or updating the database.
     * 
     * Example usage:
     * ```javascript
     * const { VunshDB } = require("vunshdb-lite") // Import VunshDB
     * const result = await VunshDB.connect();
     * console.log(result.status); // true
     * console.log(result.duration); // Time in seconds
     * ```
    */
    static async connect(options = {}) {
        const { $runtime = true, $interactioncount = true } = options;
        // Update the VDBS collection with the provided options

        const startTime = Date.now();
        try {

            // Validate Database path and Collections
            await VDBFileManager.validateDbPath();
            await VDBFileManager.validateCltns();

            await VDBFileManager.updateCollection("vdbs", {
                "$runtime": $runtime,
                "$interactioncount": $interactioncount
            });

            // Reset Runtime Collection to 0 regardless if it is enabled
            await VDBFileManager.updateCollection("rt", { "collection": 0 });
            await VDBFileManager.updateCollection("ci", { "interactions": 0 });

            // Start updating the Runtime collection every second if $runtime is enabled
            if ($runtime) {
                setInterval(async () => {
                    try {
                        const runtimeData = await VDBFileManager.getCollection("rt");

                        // Increment the runtime by 1
                        await VDBFileManager.updateCollection("rt", { "collection": runtimeData.collection + 1 });
                    } catch (e) {
                        console.error(`[VunshDB] Error updating Runtime Collection (Collection may have been deleted)\n${e}`);
                    }
                }, 1000); // Update every second

            }

            return {
                status: true, // Return true status
                duration: (Date.now() - startTime) / 1000 // Return time taken to initialize (in seconds)
            };
        } catch (e) {
            throw new Error(`[VunshDB] Error initializing VunshDB\n${e}`);
        }
    }

    /**
     * Constructor to create a new Schema
     * @param {Object} schemaDefinition - The schema definition object that specifies the structure and types for the document.
     *   Example: 
     *   ```javascript
     *      const schema = new Schema({
     *          _id: false,
     *          tag: {
     *              trigger: String,
     *              content: String
     *          }
     *      });
     *   ```
     */
    static Schema = class {
        constructor(schemaDefinition) {
            this.schemaDefinition = schemaDefinition;  // Holds the schema definition for validation and defaulting
        }

        /**
         * Applies default values to data based on the schema definition.
         * @param {Object} data - The data to apply defaults to.
         * @param {Object} schema - The schema to use for default application.
         * @returns {Object} - The data with default values applied.
         */
        applyDefaults(data, schema = this.schemaDefinition) {
            const defaultData = {};

            for (let field in schema) {
                const fieldDefinition = schema[field];

                // Check if the field exists in `data` and use it if so
                if (data[field] !== undefined) {
                    defaultData[field] = data[field];
                } else {
                    // Handle primitive types like Boolean, String, etc.
                    if (fieldDefinition.type) {
                        if (fieldDefinition.default !== undefined) {
                            defaultData[field] = fieldDefinition.default; // Apply default if exists
                        } else if (fieldDefinition.type === Boolean) {
                            defaultData[field] = false;  // Default for Boolean
                        } else if (fieldDefinition.type === String) {
                            defaultData[field] = '';     // Default for String
                        } else {
                            defaultData[field] = null;   // Default for other primitive types
                        }
                    }
                    // Handle nested objects (avoid auto-creating them if not needed)
                    else if (typeof fieldDefinition === "object" && !Array.isArray(fieldDefinition) && !(fieldDefinition instanceof Function)) {
                        defaultData[field] = this.applyDefaults(data[field] || {}, fieldDefinition); // Recurse into nested objects, only if needed
                    }
                    // Handle arrays (default to empty array if missing)
                    else if (Array.isArray(fieldDefinition)) {
                        defaultData[field] = data[field] || [];  // Only default to empty array if not provided
                    }
                    // Handle other cases (for unexpected data types)
                    else {
                        defaultData[field] = data[field] !== undefined ? data[field] : fieldDefinition;
                    }
                }
            }

            // Ensure _id handling (if not provided, generate it)
            if (!("_id" in data)) {
                defaultData._id = createUUID();
            }

            return defaultData;
        }





        /**
         * Validates that the data matches the schema definition.
         * @param {Object} data - The data to validate.
         * @param {Object} schema - The schema definition to validate against.
         * @param {string} path - The current path being validated (used for nested objects).
         * @throws {Error} - If validation fails, throws an error with a detailed message.
         */
        validate(data, schema = this.schemaDefinition, path = "") {
            for (let field in data) {
                if (field === "_id") continue;  // Skip validation for the "_id" field

                // Skip iteration if the field name is a number (i.e., '0', '1', '2', etc.)
                if (!isNaN(Number(field))) continue;

                // Now check if the field exists in the schema
                if (!schema.hasOwnProperty(field)) {
                    throw new Error(`[VunshDB] Field "${path}${field}" is not defined in the schema.`);
                }

                const fieldDefinition = schema[field];
                const fieldType = fieldDefinition?.type || fieldDefinition;
                const dataType = typeof data[field];

                if (data[field] === undefined) continue;  // Skip if the field is not defined

                // Validate nested objects recursively
                if (typeof fieldDefinition === "object" && !Array.isArray(fieldDefinition) && !(fieldDefinition instanceof Function)) {
                    this.validate(data[field], fieldDefinition, `${path}${field}.`);
                }
                // Validate data types
                else if (
                    // Ignore types like Boolean, String, Array, Object
                    (fieldType !== Boolean && typeof data[field] !== "boolean") &&
                    (fieldType !== String && typeof data[field] !== "string") &&
                    (fieldType !== Array && !Array.isArray(data[field])) &&
                    (fieldType !== Object && typeof data[field] !== "object") &&
                    (fieldType !== Number && typeof data[field] !== "number") &&
                    (typeof fieldType === 'function' && typeof data[field] === 'function') // Check for functions
                ) {
                    throw new Error(`Invalid type for ${path}${field}: Expected ${fieldType.name}, got ${dataType}`);
                }


            }
        }
    };

    /**
     * Defines a model class for interacting with a specific collection in the database.
     * @param {string} collectionName - The name of the collection.
     * @param {Object} schema - The schema that defines the structure of the documents.
     * @returns {Object} - The model class for interacting with the collection.
    */
    static model(collectionName, schema) {
        return new class {
            constructor() {
                this.collectionName = collectionName;  // The collection's name
                this.schema = schema;  // The schema used for validating and creating documents
            }

            /**
             * Creates a new document in the collection with the given data.
             * @param {Object} data - The data to create the document with.
             * @returns {Object} - The created document with defaults and validation applied.
            */
            async create(data) {
                updateInteractions()
                await this._ensureCollection();  // Ensure the collection exists before proceeding
                const filePath = await getDbFile(this.collectionName);  // Get the file path for the database
                const db = JSON.parse(fs.readFileSync(filePath));  // Read the existing database

                const newData = this.schema.applyDefaults(data);  // Apply schema defaults to the data
                this.schema.validate(newData);  // Validate the data against the schema

                newData.save = async () => {
                    return await this.save(newData);  // Attach a save method to the document
                };

                // Ensure _id is correctly set or generated
                if (!("_id" in this.schema.schemaDefinition)) {
                    newData._id = createUUID();  // Generate a new UUID for the document
                } else if (this.schema.schemaDefinition._id === false) {
                    delete newData._id;  // If the schema prohibits _id, remove it
                } else if (newData._id === undefined) {
                    newData._id = createUUID();  // Ensure _id is set if it's undefined
                }

                db.push(newData);  // Add the new document to the database
                fs.writeFileSync(filePath, JSON.stringify(db, null, 2));  // Save the database

                return newData;  // Return the created document
            }

            /**
             * Wipe all the data
             * @returns {Boolean} - Returns true when the data was wiped.
            */
            async wipe() {
                updateInteractions()
                const filePath = await getDbFile(this.collectionName);
                fs.writeFileSync(filePath, "[]");
                return true;
            }

            /**
             * Finds a document by its criteria (e.g., by field matching).
             * @param {Object} criteria - The criteria to match for finding the document.
             * @returns {Object|null} - The found document or null if not found.
            */
            async findOne(criteria) {
                updateInteractions()
                const filePath = await getDbFile(this.collectionName);  // Get the file path for the collection
                const db = JSON.parse(fs.readFileSync(filePath));  // Read the database

                let doc = db.find((doc) =>
                    Object.keys(criteria).every((key) => doc[key] === criteria[key])  // Match all criteria fields
                );

                if (!doc) return null;  // Return null if no document matches

                doc = this.schema.applyDefaults(doc);  // Apply default values to the found document
                doc.save = async () => {
                    return await this.save(doc);  // Attach the save method to the found document
                };

                return doc;  // Return the found document
            }

            /**
             * Finds a document by its _id.
             * @param {string} id - The ID of the document to find.
             * @returns {Object|null} - The found document or null if not found.
            */
            async findById(id) {
                updateInteractions()
                return await this.findOne({ _id: id });  // Use findOne to search by _id
            }

            /**
             * Finds multiple documents by the given criteria.
             * @param {Object} criteria - The criteria to match for finding documents.
             * @returns {Array} - An array of documents that match the criteria.
            */
            async findMany(criteria) {
                updateInteractions()
                const filePath = await getDbFile(this.collectionName);  // Get the collection's file path
                const db = JSON.parse(fs.readFileSync(filePath));  // Read the database

                return db
                    .filter((doc) =>
                        Object.keys(criteria).every((key) => doc[key] === criteria[key])  // Match all criteria fields
                    )
                    .map(doc => this.schema.applyDefaults(doc));  // Apply defaults to all matching documents
            }

            /**
             * Deletes a single document that matches the given criteria.
             * @param {Object} criteria - The criteria to match for deletion.
             * @returns {boolean} - Returns true if a document was deleted, false otherwise.
            */
            async deleteOne(criteria) {
                updateInteractions();
                const filePath = await getDbFile(this.collectionName);
                let db = JSON.parse(fs.readFileSync(filePath));

                const index = db.findIndex(doc => Object.keys(criteria).every(key => doc[key] === criteria[key]));

                if (index === -1) return false; // No document found to delete

                db.splice(index, 1); // Remove the document
                fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

                return true;
            }

            /**
             * Deletes multiple documents that match the given criteria.
             * @param {Object} criteria - The criteria to match for deletion.
             * @returns {number} - The number of documents deleted.
            */
            async deleteMany(criteria) {
                updateInteractions();
                const filePath = await getDbFile(this.collectionName);
                let db = JSON.parse(fs.readFileSync(filePath));

                const initialLength = db.length;
                db = db.filter(doc => !Object.keys(criteria).every(key => doc[key] === criteria[key]));

                const deletedCount = initialLength - db.length;

                fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

                return deletedCount;
            }

            /**
             * Saves a document to the database, either creating or updating it.
             * @param {Object} data - The document data to save.
             * @returns {Object} - The saved document.
            */
            async save(data) {
                updateInteractions()
                const filePath = await getDbFile(this.collectionName);  // Get the file path for the collection
                let db = JSON.parse(fs.readFileSync(filePath));  // Read the database

                const schemaFields = Object.keys(this.schema.schemaDefinition);  // Get the schema fields

                // Validate that all fields in the document are defined in the schema
                for (let key in data) {
                    if (
                        key !== "_id" &&
                        key !== "__originalId" &&
                        typeof data[key] !== "function" &&
                        !schemaFields.includes(key)
                    ) {
                        throw new Error(`[VunshDB] Field "${key}" is not defined in the schema.`);
                    }
                }

                const index = db.findIndex((doc) => doc._id === data._id);  // Find the document by _id
                if (index === -1) {
                    db.push(data);  // If not found, add as a new document
                } else {
                    db[index] = data;  // If found, update the existing document
                }

                fs.writeFileSync(filePath, JSON.stringify(db, null, 2));  // Save the updated database
                return data;  // Return the saved document
            }

            /**
             * Ensures the collection exists by creating the necessary files and directories if they don't exist.
             * @returns {Promise<void>} - A promise that resolves when the collection is ensured.
            */
            async _ensureCollection() {
                const collectionPath = await getDbFile(this.collectionName);  // Get the collection's file path

                // Check if the collection file exists, and create it if not
                if (!fs.existsSync(collectionPath)) {
                    fs.mkdirSync(collectionPath, { recursive: true });  // Create the directory recursively
                    fs.writeFileSync(collectionPath, JSON.stringify([], null, 2));  // Create an empty database file
                }
            }
        };
    }

}

module.exports = VunshDB;

async function updateInteractions() {
    const vdbs = await getCollection("vdbs")
    if (vdbs.$interactioncount) {
        try {
            const ti = await getCollection("ti");
            const ci = await getCollection("ci");
            await updateCollection("ti", { "interactions": ti.interactions + 1 });
            await updateCollection("ci", { "interactions": ci.interactions + 1 });
        } catch (e) {
            throw new Error(`[VunshDB] Error updating interacount counts\n${e.stack}`)
        }
    }
}

/* Developed by hatebeingsobercereal on Discord :: last updated 3/13/25 */