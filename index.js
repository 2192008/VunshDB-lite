const VunshDB = require("./src/ctrlr");
const { VDBFileManager } = require("./src/vdbfm");

// Settings object to store VunshDB settings
const VDBSettings = {
    $runtime: true, // Whether to track runtime or not (default: true)
    $interactioncount: true // Whether to count interactions or not (default: true)
};

/**
 * Initializes the VunshDB by validating the database path, resetting the 
 * "Current Runtime" (cr) collection to 0, and starting an interval to update 
 * the "Current Runtime" collection every second.
 * 
 * The function performs the following steps:
 * 1. Validates the database path by calling `validateDbPath`.
 * 2. Resets the "cr" (Current Runtime) collection to 0 by calling `updateCollectionDev`.
 * 3. Starts a `setInterval` to update the "cr" collection every second, incrementing its value by 1.
 * 4. Returns an object containing:
 *    - `status`: A boolean indicating the successful initialization (`true`).
 *    - `duration`: The time taken to initialize the database (in seconds).
 * 
 * @async
 * @function initializeVunshDB
 * 
 * @param {Object} [options={}] - The optional settings to control runtime and interaction counting.
 * @param {boolean} [options.runTime=true] - Whether to track the runtime or not.
 * @param {boolean} [options.interactionCounts=true] - Whether to count interactions or not.
 * 
 * @returns {Promise<Object>} The initialization result object.
 * @returns {boolean} returns.status - Status of the initialization (`true`).
 * @returns {number} returns.duration - Time taken for initialization (in seconds).
 * 
 * @throws {Error} If any error occurs during initialization or updating the database.
 * 
 * Example usage:
 * ```javascript
 * const result = await initializeVunshDB();
 * console.log(result.status); // true
 * console.log(result.duration); // Time in seconds
 * ```
*/
async function initializeVunshDB(options = {}) {
    const { $runtime = VDBSettings.$runtime, $interactioncount = VDBSettings.$interactioncount } = options;

    // Set the VDBSettings to match the passed options
    VDBSettings.$runtime = $runtime;
    VDBSettings.$interactioncount = $interactioncount;

    const startTime = Date.now();
    try {
        // Validate the database path before initialization
        await VDBFileManager.validateDbPath();
        // Reset the Current Runtime collection to 0 regardless of $runtime
        await VDBFileManager.updateCollectionDev("cr", 0);
        
        if ($runtime) {
            // Start updating the 'cr' collection every second if $runtime is enabled
            setInterval(async () => {
                try {
                    const currentRuntime = await VDBFileManager.getCollection("cr");
                    await VDBFileManager.updateCollectionDev("cr", currentRuntime + 1); // Increment by 1 every second
                } catch (e) {
                    console.error(`[VunshDB] Error updating cr collection\n${e}`);
                }
            }, 1000); // Update every second
        }

        return {
            status: true, // Return status as true 
            duration: (Date.now() - startTime) / 1000 // Return time taken to initialize (in seconds)
        };
    } catch (e) {
        throw new Error(`[VunshDB] Error initializing VunshDB\n${e}`);
    }
}


module.exports = {
    Schema: VunshDB.Schema,
    model: VunshDB.model,
    getCollection: VDBFileManager.getCollection,
    initializeVunshDB,
    VDBSettings
};

/* Created by hatebeingsobercereal on Discord :: last updated 3/10/25 */
