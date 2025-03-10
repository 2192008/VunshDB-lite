const { createDbFile, getDbFile, getCollection, updateCollectionDev } = require("./vdbfm");
const fs = require("fs");

class Controller {
    static Schema = class {
        constructor(schemaDefinition) {
            this.schemaDefinition = schemaDefinition;
        }

        applyDefaults(data) {
            const defaultData = {};

            for (let field in this.schemaDefinition) {
                const fieldDefinition = this.schemaDefinition[field];
                if (fieldDefinition.default && data[field] === undefined) {
                    defaultData[field] = fieldDefinition.default;
                } else {
                    defaultData[field] = data[field];
                }
            }

            return defaultData;
        }

        validate(data) {
            for (let field in this.schemaDefinition) {
                const fieldDefinition = this.schemaDefinition[field];
                const fieldType = fieldDefinition.type;

                if (fieldType) {
                    const dataType = typeof data[field];

                    if (fieldType === String && dataType !== 'string') {
                        throw new Error(`Invalid type for ${field}: Expected String, got ${dataType}`);
                    } else if (fieldType === Number && dataType !== 'number') {
                        throw new Error(`Invalid type for ${field}: Expected Number, got ${dataType}`);
                    } else if (fieldType === Boolean && dataType !== 'boolean') {
                        throw new Error(`Invalid type for ${field}: Expected Boolean, got ${dataType}`);
                    } else if (fieldType === Object && dataType !== 'object') {
                        throw new Error(`Invalid type for ${field}: Expected Object, got ${dataType}`);
                    } else if (fieldType === Array && !Array.isArray(data[field])) {
                        throw new Error(`Invalid type for ${field}: Expected Array, got ${dataType}`);
                    }
                }
            }
        }
    };

    static model(collectionName, schema) {
        return new class {
            constructor() {
                this.collectionName = collectionName;
                this.schema = schema;
            }

            async create(data) {
                await this._ensureCollection();
                const filePath = await getDbFile(this.collectionName);
                const db = JSON.parse(fs.readFileSync(filePath));

                const newData = this.schema.applyDefaults(data);
                this.schema.validate(newData);

                newData.save = async () => {
                    return await this.save(newData);
                };

                if (!newData._id) {
                    newData._id = Date.now().toString();
                }

                db.push(newData);
                fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

                return newData;
            }

            async findOne(criteria) {
                const filePath = await Controller.getDbFile(this.collectionName);
                const db = JSON.parse(fs.readFileSync(filePath));
            
                let doc = db.find((doc) =>
                    Object.keys(criteria).every((key) => doc[key] === criteria[key])
                );
            
                if (!doc) return null;

                doc.save = async () => {
                    return await this.save(doc);
                };
            
                return doc;
            }
            
            async findById(id) {
                const filePath = await getDbFile(this.collectionName);
                const db = JSON.parse(fs.readFileSync(filePath));
            
                let doc = db.find((doc) => doc._id === id);
            
                if (!doc) return null;
            
                doc.save = async () => {
                    return await this.save(doc);
                };
            
                return doc;
            }

            async findMany(criteria) {
                const filePath = await Controller.getDbFile(this.collectionName);
                const db = JSON.parse(fs.readFileSync(filePath));

                return db.filter((doc) =>
                    Object.keys(criteria).every((key) => doc[key] === criteria[key])
                );
            }

            async save(data) {
                const filePath = await getDbFile(this.collectionName);
                let db = JSON.parse(fs.readFileSync(filePath));
            
                const schemaFields = Object.keys(this.schema.schemaDefinition);
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
            
                const index = db.findIndex((doc) => doc._id === data._id);
            
                if (index === -1) {
                    const originalIndex = db.findIndex((doc) => doc._id === data.__originalId);
                    if (originalIndex !== -1) {
                        db.splice(originalIndex, 1);
                    }
                    db.push(data);
                } else {
                    db[index] = data;
                }
            
                fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
            
                data.__originalId = data._id;
            
                return data;
            }

            async deleteMany(criteria) {
                const filePath = await Controller.getDbFile(this.collectionName);
                const db = JSON.parse(fs.readFileSync(filePath));

                const updatedDb = db.filter((doc) =>
                    !Object.keys(criteria).every((key) => doc[key] === criteria[key])
                );

                fs.writeFileSync(filePath, JSON.stringify(updatedDb, null, 2));
            }

            async deleteOne(criteria) {
                const filePath = await Controller.getDbFile(this.collectionName);
                const db = JSON.parse(fs.readFileSync(filePath));

                const updatedDb = db.filter((doc) =>
                    !Object.keys(criteria).every((key) => doc[key] === criteria[key])
                );

                fs.writeFileSync(filePath, JSON.stringify(updatedDb, null, 2));
            }

            async _ensureCollection() {
                await getDbFile(this.collectionName);
            }
        };
    }
}

module.exports = Controller