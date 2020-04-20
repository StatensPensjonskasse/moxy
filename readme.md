# Moxy

![Moxy, The Good Guy in the Middle](./designs/moxy-logo-tagline.png)

![Node.js CI](https://github.com/StatensPensjonskasse/moxy/workflows/Node.js%20CI/badge.svg?branch=master)

## Q&A

### What does Moxy solve?

To test rendering of client side applications we sometimes need fairly large sets of
test data, and sometimes these data sets can have fairly complex structures. Maintaining
these data sets can get time consuming.

With a modular architecture, the responses back to the client often come from numerous
Web Services, and these Web Services are often maintained across multiple development teams,
requiring a lot of coordination when maintaining the sets of test data.

**Moxy** gives us the ability to record all data while navigating the application,
and create static mocks for all underlying Web Services. Once recordings have been made
the static mocks can be injected and reused in our tests suites.

### How does Moxy store the mocks?

Moxy saves the mocks in any way that suites you. You can find examples for how to store
mocks as in memory data, or with MongoDB, in the `cacheControl` directory in this project.

### How has Moxy been implemented?

**Moxy** is an [Express middleware](https://expressjs.com/en/guide/using-middleware.html).
When injected as middleware, it is added to the different routes or to all routes
in your application. Se the [Basic Setup section](#basic-setup) for more information about how to use
**Moxy**.

## Developer's Vision

**Moxy** should be as small as possible, with easy setup and customization. All 3rd party
libraries are passed to **Moxy** as arguments to reduce the number of dependencies.

## Special Thanks

**Moxy** was heavily inspired by [Troxy](https://github.com/SpareBank1/Troxy), developed
by SpareBank1. [Troxy](https://github.com/SpareBank1/Troxy) is a Java-based application that does many of the same things as
**Moxy**. Many thanks to SpareBank1 for sharing their knowledge with us and providing inspiration.

## Basic Setup

### Installation

`npm install --save-dev @statenspensjonskasse/moxy`

### Adding Moxy to Global Scope

```javascript
const { moxy } = require('@statenspensjonskasse/moxy');
const express = require('express');
const app = express();

app.use(moxy());

app.listen(1337);
```

In the above example **Moxy** defaults to `memoryCacheControl` which saves all recorded data
to memory. It also defaults to a [Transformer](#transformer) that does make any changes.

### Adding Moxy to Specific Routes

```javascript
const { moxy } = require('@statenspensjonskasse/moxy');
const express = require('express');
const app = express();

app.get('/', moxy(), (req, res) => {
  res.send('Hello, Moxy!');
});

app.listen(1337);
```

## Transformer

You can make any changes you want to the recorded data, as they are being recorded,
with a transformer function. The function receives the data that **Moxy** will save
and must return the transformed value.

Here is a simple example that would remove email addresses from a user list endpoint.

```javascript
app.get('/users', ,moxy({
  transformer: users => users.map(user => user.email = 'XXXXX@test.com')
}));
```

## Modes

**Moxy** can be run in a set of modes. These are:

- `PASSTHROUGH` - The default. **Moxy** will just pass all data through, not doing anything.
- `PLAYBACK` - **Moxy** will act as a mock and play back recorded test data.
- `RECORD` - **Moxy** will record all the data that passes through it.
- `RECORD_PLAYBACK` - **Moxy** will record all the data that passes through it. It will also act as a mock for test data that has been recorded.

### Setting the Mode at Start Up

```javascript
const { moxy } = require('@statenspensjonskasse/moxy');
const express = require('express');
const app = express();

app.use(
  moxy({
    mode: 'PLACKBACK',
  })
);

app.listen(1337);
```

## Using MongoDB Cache Control

In the below example we depend on [mongoose](https://mongoosejs.com) for inserting into and reading
data from MongoDB. We recommend using version `5.9.3` or newer.

```javascript
const { moxy, databaseControl } = require('@statenspensjonskasse/moxy');
const mongoose = require('mongoose');
const express = require('express');
const { moxy, databaseControl } = require('@statenspensjonskasse/moxy');
const app = express();

// Setup connection to MongoDB
mongoose
  .connect('mongodb://localhost:27017/moxy', {
      user: 'moxy',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      pass: 'moxy',
  })
  .then(() => {
      console.log('Connected to MongoDB!');
  })
  .catch((err: any) => {
      console.error('Unable to connect to MongoDB', err);
      throw err;
});

app.use(moxy({
  cacheControl: databaseControl(mongoose),
));

app.listen(1337);
```

## Using Your Own Cache Control

```javascript
const { moxy } = require('@statenspensjonskasse/moxy');
const express = require('express');
const app = express();

const myCacheControl = () => {
  ...
  return {
    record,
    find,
  }
};

app.use(moxy({
  cahceControl: myCacheControl(),
));

app.listen(1337);
```

How to create your own cache control is described in [Creating New Cache Control](#creating-new-cache-control).

## Changing Moxy Modes Runtime

If you wish to toggle **Moxy**'s mode while the application is running, add `MoxyRouter`
to your application and use the following REST endpoints to update the mode.

### Adding MoxyRouter

```javascript
const { moxy, MoxyRouter } = require('@statenspensjonskasse/moxy');
const express = require('express');
const app = express();

app.use(MoxyRouter());
app.use(moxy());

app.listen(1337);
```

### Moxy's Rest Endpoints

#### GET

Returns the current mode.

```text
URI: /moxy
Methd: GET
```

#### POST

Sets the current mode.

```text
URI: /moxy?mode=[One of the different Moxy Modes in uppercase]
Method: POST
```

Example: `/moxy?mode=PLAYBACK`

## Creating New Cache Control

Your new Cache Control must return an object with two functions:

- `record`
- `find`

Both functions must return a `Promise`.

### Record

Record's responsibility is to store the mocks that you wish to save. How you save them is up to you.

```javascript
const record = (url: string, value: any) => {
  return new Promise((resolve, reject) => {
    // Save the recording how you see fit.

    // End the function with resolving the object that you saved.
    resolve(value);
  );
}
```

### Restrictions to Record

`value` must have a `method` attribute. This is because we want to be able to return
different responses for each method for each URL.

- GET: `/resources`
- POST: `/resources`

### Find

Find's responsibility is to search your previously saved mocks and return a mock if found.

```javascript
const find = (url: string, method: string) => {
  new Promise((resolve, reject) => {
    // Search through your saved mocks

    // if nothing found
    reject();
    // when you find something
    resolve(something);
  });
};
```
