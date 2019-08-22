<p align="center"><a style="display:block;text-align:center" href="https://github.com/harryhope/sparkplug"><img src="https://user-images.githubusercontent.com/2415156/35135437-5d3ccf46-fcab-11e7-91cc-4eec929aeb04.png" width="359" alt="sparkplug"/></a></p>

***

[![Build Status](https://travis-ci.org/harryhope/sparkplug.svg?branch=master)](https://travis-ci.org/harryhope/sparkplug)

Sparkplug is a very thin wrapper over DynamoDB DocumentClient with a nicer, Promise-based interface that feels more idiomatic to javascript. That means less nested indecipherable json and [PascalCase](http://wiki.c2.com/?PascalCase)'d properties. 

Sparkplug isn't intended to be an ODM or a heavy abstraction over Amazon's client. It also doesn't deal with setting up table schemas programatically, as that is best left to [Terraform](https://www.terraform.io), [CloudFormation](https://aws.amazon.com/cloudformation/) or configuration through tooling such as [serverless](https://serverless.com).

```js
const Sparkplug = require('sparkplug')
const plug = new Sparkplug()

plug
  .table('accounts')
  .get({ email: 'darth.vader@hothmail.com' })
  .then(({ data }) => {
    console.log(data.name)
  }).catch((err) => {
    // handle errors
  })
```

## Installation
Sparkplug is available through the [npm registry](https://www.npmjs.com/)

Download and install using `npm install`.
```
npm install sparkplug
```

## Usage
- [Configuration](#configuration)
- [Selecting Tables](#selecting-tables)
- [Reading Data](#reading-data)
- [Writing and Deleting](#writing-and-deleting)
- [Queries and Scans](#queries-and-scans)
- [Batch Operations](#batch-operations)

---

### Configuration
Instances of Sparkplug can be passed configuration options. Sparkplug accepts the same config options that Amazon's [DynamoDB](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html) client does, including [`endpoint` and `region`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#endpoint-property).

If you're running in context such as a Lambda function, you might not need to pass in any values at all, as they are automatically configured on AWS.

```js
const Sparkplug = require('sparkplug')

// Use default environment variables.
const plug = new Sparkplug()
```

If running locally via [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) or [Dynalite](https://github.com/mhart/dynalite), you can use the `localhost` region along with the local endpoint.

```js
// Use a locally running DynamoDB instance.
const localPlug = new Sparkplug({
  region: 'localhost',
  endpoint: 'http://localhost:4567'
})
```

### Selecting Tables
Select which DynamoDB table to query with the `.table()` method. Database operations can be chained off of the return value of this method.
```js
const plug = new Sparkplug()
const accounts = plug.table('accounts')
```


### Reading Data
Use `.get()` method of `Table` to perform read operations on the database. `.get()` accepts an object with a primary key and value to look up, and returns a native Promise object.

In this example, query the `accounts` table for a record where `email` is `'darth.vader@hothmail.com'`.
```js
plug
  .table('accounts')
  .get({ email: 'darth.vader@hothmail.com' })
  .then(({ data }) => {
    console.log(data.name)
  }).catch((err) => {
    // handle errors
  })
```

### Writing and Deleting
Use the `.put()` and `.delete()` methods to create/update or delete entries respectively. The object passed to put must include a primary key of the table (in our example it is `email`).
```js
plug
  .table('accounts')
  .put({ 
    email: 'admiral.ackbar@hothmail.com',
    name: 'Admiral Ackbar',
    planet: 'Mon Calamari'
   })
  .then(({ data }) => {
    console.log(data.name)
  }).catch((err) => {
    // handle errors
  })
```

`.delete()` accepts a primary key, similarly to `.get()`.
```js
plug
  .table('accounts')
  .delete({ email: 'admiral.ackbar@hothmail.com' })
  .then(() => {
    // perform actions after deletion
  }).catch((err) => {
    // handle errors
  })
```

### Queries and Scans
Queries and Scans are both supported by Sparkplug.

#### Scan
[Scans](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html) are a simple way to search on a non-primary key. Use the `exec()` method to execute the scan and return a Promise.
```js
plug
  .table('accounts')
  .scan({ planet: 'Mon Calamari' })
  .exec()
  .then(({ data }) => {
    // `data` contains results of scan
  }).catch((err) => {
    // handle errors
  })

```

#### Queries
[Queries](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html) can be used as more performant lookups on primary keys or secondary indexes.

To query a primary key, use `.query()`.
```js
const promise = plug
  .table('accounts')
  .query({ email: 'admiral.ackbar@hothmail.com' })
  .exec()
```

To query a secondary index, chain the `.on()` method to the query. The below example assumes you've set up a secondary index on `name`.
```js
const promise = plug
  .table('accounts')
  .query({ name: 'Admiral Ackbar' })
  .on('name')
  .exec()
```


#### Start and Limit
Scans and queries can paginate through results with the `.start()` and `.limit()` methods of the `Scan` or `Query` objects.

This query starts at the object with the given primary key and limits the response to 2 results after the given key. 
```js
const promise = plug
  .table('accounts')
  .scan()
  .start({ email: 'admiral.ackbar@hothmail.com' })
  .limit(2)
  .exec()
```

#### Strong Consistency
Scans perform eventually consistent reads by default. To use [strong consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html#Scan.ReadConsistency), use the `.strongRead()` method of `Scan`
```js
const promise = plug
  .table('accounts')
  .scan({ planet: 'Mon Calamari' })
  .strongRead()
  .exec()
```

### Batch Operations
You can use Sparkplug to make batch `get` and `put` and `delete` requests by using the `.batch()` method. Batch operations accept a sparkplug `Table` as their first parameter and either an object or array of objects as their second.

```js
const accounts = sparkplug.table(ACCOUNT_TABLE)
const orgs = sparkplug.table(ORG_TABLE)
const promise = plug
  .batch()
  .put(accounts, [{
    email: 'admiral.ackbar@hothmail.com',
    name: 'Admiral Ackbar',
    planet: 'Mon Calamari'
  }, {
    email: 'darth.vader@hothmail.com',
    name: 'Darth Vader',
    planet: 'Tatooine'
  }])
  .put(orgs, {
    name: 'Github',
    id: 45678
  })
  .exec()
```

## Contributing
Sparkplug is open for contributions via GitHub Pull Requests!

To run tests and a coverage report against the codebase: 
- clone the repository, 
- run `npm i` to install dependencies
- run `npm test`
