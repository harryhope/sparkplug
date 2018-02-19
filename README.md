<p align="center"><a style="display:block;text-align:center" href="https://github.com/harryhope/sparkplug"><img src="https://user-images.githubusercontent.com/2415156/35135437-5d3ccf46-fcab-11e7-91cc-4eec929aeb04.png" width="359" alt="sparkplug"/></a></p>

***

Sparkplug is a very thin wrapper over DynamoDB DocumentClient with a nicer interface that feels more idomatic to javascript. That means less nested indecipherable json and [PascalCase](http://wiki.c2.com/?PascalCase)'d properties. 

Sparkplug isn't intended to be an ORM or a heavy abstraction over Amazon's client. It also doesn't deal with setting up table schemas programatically, as that is best left to [CloudFormation](https://aws.amazon.com/cloudformation/) or configuration through tooling such as [serverless](https://serverless.com).

```js
const Sparkplug = require('sparkplug')
const plug = new Sparkplug()

plug
  .table('accounts')
  .get({ email: 'darth.vader@hotmail.com' })
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
