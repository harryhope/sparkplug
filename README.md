<p align="center"><a style="display:block;text-align:center" href="https://github.com/harryhope/sparkplug"><img src="https://user-images.githubusercontent.com/2415156/35135437-5d3ccf46-fcab-11e7-91cc-4eec929aeb04.png" width="359" alt="sparkplug"/></a></p>

***

[![Build Status](https://travis-ci.org/harryhope/sparkplug.svg?branch=master)](https://travis-ci.org/harryhope/sparkplug)

Sparkplug is a very thin wrapper over DynamoDB DocumentClient with a nicer, Promise-based interface that feels more idomatic to javascript. That means less nested indecipherable json and [PascalCase](http://wiki.c2.com/?PascalCase)'d properties. 

Sparkplug isn't intended to be an ORM or a heavy abstraction over Amazon's client. It also doesn't deal with setting up table schemas programatically, as that is best left to [CloudFormation](https://aws.amazon.com/cloudformation/) or configuration through tooling such as [serverless](https://serverless.com).

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
