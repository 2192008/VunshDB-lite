# Welcome to VunshDB!

## Overview
VunshDB is an open-source, lightweight, localized file-based database system designed for simple and efficient data storage using `.vunsh.db` files. Unlike traditional databases, it does not require a server and provides an easy-to-use API for managing structured data.

-   **File-based Storage**: Stored as `.vunsh.db` files with a custom format.
-   **Simple API**: CRUD operations with minimal setup.
-   **Data Integrity**: Ensures proper formatting and error handling.

## Installation

```sh
npm install vunshdb
```

## Usage

### Importing VunshDB
```js
const VunshDB = require("vunshdb");
```
### initializing VunshDB
> While `initializeVunshDB()` is **not required** to use VunshDB, it is **highly recommended** to ensure that the system functions as intended. Calling this function at the start of your application will:

-   Prepare the necessary directories and files.
-   Validate the database structure.
-   Initialize default settings like $runtime and $interactioncount for tracking usage.
-   Prevent potential errors related to uninitialized storage.

#### Usage

```js
const { initializeVunshDB } = require("vunshdb");

(async () => {
    await initializeVunshDB({
        $runtime: true, // Tracks the database initialization time - Auto sets as true
        $interactioncount: true, // Counts the number of interactions - Auto sets as true
    });
})();

```

### Defining a Schema
> A **schema** defines the expected structure of a collection. It helps enforce data consistency by specifying the required fields and their types.

#### Usage
```js
const { Schema } = require("vunshdb")

const userSchema = new Schema({
    username: "string",
    age: "number",
    email: "string",
    isAdmin: "boolean",
});
```

### Defining a Model
> A **model** in VunshDB is used to interact with a data objects. It provides methods to create, read, update, and delete (CRUD) records.

#### Usage
```js
const { Schema, model } = require("vunshdb")

const userSchema = new Schema({
	_id: false,
    username: String,
    age: Number,
    email: String,
    isAdmin: Boolean
});

const User = model("Users", userSchema)

module.exports = { User }
```

## Creating a New Document
> Once you have a **model**, you can use it to create and insert new records (documents) into the database.

#### Usage
```js
const { User } = require("./path/to/User"); // Import the User model

(async () => {
    await User.create({
        username: "JohnDoe",
        age: 25,
        email: "johndoe@example.com",
        isAdmin: false,
    });

    console.log("User created successfully!");
})();
```
> This will insert a new record into the **Users** collection based on the schema defined earlier.

#### What Happens Internally?

-   **Validates** the data against the schema.
-   **Formats** fields according to the expected types.
-   **Stores** the new document inside the `.vunsh.db` collection file. So in this case it would be `Users.vunsh.db`

> **Note:** The `_id` field is automatically generated by default unless explicitly disabled in the schema. Alternatively, a custom `_id` can be defined.

## Querying Data (Finding Documents)

> You can retrieve documents from your database using `.findOne()` or `.findMany()`

### Find a single Document
```js
const { User } = require("./path/to/User");

(async () => {
    const user = await User.findOne(doc => doc.username === "JohnDoe");
    console.log(user)  // { username: "JohnDoe", age: 25, email: "johndoe@example.com", isAdmin: false }
})();
```

### Query Multiple Documents
```js
const { User } = require("./path/to/User");

const users = await User.findMany(doc => doc.age > 20);
console.log(users) // All users older than 20
```

## Editing a Document
> Once you retrieve a document, you can modify its properties and save the changes.

#### Usage
#### This method uses `.findOne()` as we disabled `_id` in the previous Schema
```js
const { User } = require("./path/to/User"); // Import the User model

(async () => {

	const  data  =  await  User.findOne(doc  =>  doc.username  ===  "JohnDoe"  && doc.age   ===  25)
	console.log(data) // { username: "JohnDoe", age: 25, email: "johndoe@example.com", isAdmin: false }

	// Edit the document
	data.isAdmin  =  true
	// Save the document
	await  data.save()
	console.log(data) // { username: "JohnDoe", age: 25, email: "johndoe@example.com", isAdmin: true }

})();
```

#### Example with `.findById()` if `_id` was defined/generated
```js
const { initializeVunshDB } = require("vunshdb");
const { Schema, model } = require("vunshdb")

const  userSchema  =  new  Schema({
	username: String,
	age: Number,
	email: String,
	isAdmin: Boolean
});

const  User  =  model("Users", userSchema)

(async () => {
	await initializeVunshDB();

/* 
await User.create({
	username: "JohnDoe",
	age: 25,
	email: "johndoe@example.com",
	isAdmin: false
});
*/ // Create your document first

	const  data  =  await  User.findById("vdb:uuidv4") // Generated _id will be a uuidv4 with the prefix 'vdb:'
	console.log(data) // { username: "JohnDoe", age: 25, email: "johndoe@example.com", isAdmin: false }

	// Edit the document
	data.isAdmin  =  true

	// Save the document
	await  data.save()
	console.log(data) // { username: "JohnDoe", age: 25, email: "johndoe@example.com", isAdmin: true }

})();
```

## Counting Documents
> To get the number of documents in a collection, use `.count()`.

#### Usage
```js
const { User } = require("./path/to/User"); // Import the User model

const count = await User.count();
console.log(`Total users: ${count}`); // Total users: 1
```

> Alternatively you can use `.findMany()` to query specific documents as `.count()` is **Not** built into VunshDB
```js
const { User } = require("./path/to/User"); // Import the User model

const users = await User.findMany(doc => doc.age > 20);
console.log(`Users older than 20: ${users.length}`); // Users older than 20: 1
```

## Deleting Documents
> You can delete documents from the database using `.deleteOne()` to remove a single document or `.deleteMany()` to remove multiple documents at once.

### Usage

#### Deleting a single document
```js
const { User } = require("./path/to/User"); // Import the User model

await User.deleteOne(doc => doc.username === "JohnDoe");
console.log("User deleted successfully!");

```

#### Deleting multiple documents
```js
const { User } = require("./path/to/User"); // Import the User model

await User.deleteMany(doc => doc.isAdmin === false);
console.log("All non-admin users deleted!");
```

## Vunsh Collections
> VunshDB provides four built-in collections for tracking database interactions, runtime and settings
### Current Interactions (ci)
Tracks the number of interactions made during the current runtime.
Resets every time initializeVunshDB() is called.
 
### Total Interactions (ti)
Stores the total number of interactions made while using VunshDB.
This value persists/saves between restarts.

### Runtime (rt)
Represents how long VunshDB has been running in the current instance.
Resets every time initializeVunshDB() is called.

### VunshDB Settings (vdbsettings)
Stores the configuration settings of initializeVunshDB().
Indicates whether $runtime and $interactionCounts are enabled or disabled.

## Usage

```js
const { initializeVunshDB, getCollection } = require("vunshdb");

(async () => {
    await initializeVunshDB({
        $runtime: true, // Tracks the database initialization time - Auto sets as true
        $interactioncount: false, // Counts the number of interactions - Auto sets as true
    });

	const currentinteractions = await getCollection("ci")
	console.log(currentinteractions) // 0 (0 as $interactioncount is false)

	const totalinteractions = await getCollection("ti")
	console.log(totalinteractions) // 0 (0 as $interactioncount is false)

	const runtime = await getCollection("rt")
	console.log(runtime) // 0 (Updates every second)

	const vdbsettings = await getCollection("vdbs")
	console.log(runtime) // { $runtime: true, $interactioncount: false }
})();

```
