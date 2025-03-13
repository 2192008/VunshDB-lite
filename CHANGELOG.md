# Changelog (1.0.1-alpha)

## New initializeVunshDB() method
> `initializeVunshDB()` has been replaced with `.connect()`

### Old method
```js
const { initializeVunshDB } = require("vunshdb-lite")

const status = await initializeVunshDB({
    $runtime: true, // Tracks the database initialization time - Auto sets as true
    $interactioncount: true, // Counts the number of interactions - Auto sets as true
});
console.log(status)
```

### New method
```js
const { VunshDB } = require("vunshdb-lite")

const status = await VunshDB.connect({
    $runtime: true, // Tracks the database initialization time - Auto sets as true
    $interactioncount: true, // Counts the number of interactions - Auto sets as true
});
console.log(status)
```

#### Alternative
```js
const { connect } = require("vunshdb-lite")

const status = await connect({
    $runtime: true, // Tracks the database initialization time - Auto sets as true
    $interactioncount: true, // Counts the number of interactions - Auto sets as true
});
console.log(status)
```

## New `.wipe()` method
> You can now wipe entire models using `.wipe()`
### Usage
```js
const { User } = require("./path/to/User"); // Import your model

const status = await User.wipe();
console.log(status);
```

# Known errors

### `required` field in schema
> When using a `required: true` field inside of an object, it will still not require that field to be used

#### Example
```js
const { Schema, model, connect } = require("vunshdb-lite")

const  userSchema  =  new  Schema({
    name: String,
    age: {
        type: Number,
        required: true
    }
});

const  User  =  model("Users", userSchema)

(async () => {
    await connect({ $runtime: false });

    const data = await User.create({
        name: "JohnDoe"
    }) // No error will be thrown if `age` is not defined
    console.log(data) // { "_id": "vdb:<uuidv4>", "name": "JohnDoe", "age": undefined }
})();

```