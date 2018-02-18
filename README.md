<p align="center"><a style="display:block;text-align:center" href="https://github.com/harryhope/sparkplug"><img src="https://user-images.githubusercontent.com/2415156/35135437-5d3ccf46-fcab-11e7-91cc-4eec929aeb04.png" width="359" alt="sparkplug"/></a></p>

***

Sparkplug is a very thin wrapper over DynamoDB DocumentClient with a nicer interface that feels more idomatic to javascript. It's not intended to be an ORM or a heavy abstraction over Amazon's client, but to smooth out the rough edges.

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
