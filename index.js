const VunshDB = require("./src/ctrlr");
const { VDBFileManager } = require("./src/vdbfm");

module.exports = {
    VunshDB,
    connect: VunshDB.connect,
    Schema: VunshDB.Schema,
    model: VunshDB.model,
    getCollection: VDBFileManager.getCollection,
};

/* Developed by hatebeingsobercereal on Discord :: last updated 3/13/25 */