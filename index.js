const _ = require('lodash')
const DocumentClient = require('aws-sdk').DynamoDB.DocumentClient

const dynamoPromise = (client, operation, payload) => {
  return new Promise((resolve, reject) => {
    client[operation](payload, (err, resp) => {
      let formattedResponse = null
      if (err !== null) {
        return reject(err)
      }
      if (resp.Item) {
        formattedResponse = resp.Item
      } else if (resp.Responses) {
        formattedResponse = resp.Responses
      } else {
        formattedResponse = resp
      }
      return resolve(formattedResponse)
    })
  })
}

class Sparkplug {
  constructor (config) {
    this.client = new DocumentClient(config)
    return this
  }

  table (tableName) {
    return new Table(tableName, this.client)
  }

  batch (tables) {
    return new Batch(tables, this.client)
  }
}

class Batch {
  constructor (tables, client) {
    this.tables = tables
    this.client = client
    return this
  }

  get (keys) {
    return dynamoPromise(this.client, 'batchGet', {
      RequestItems: this.tables.reduce((obj, table, index) => {
        obj[table.name] = {
          Keys: _.castArray(keys[index])
        }
        return obj
      }, {})
    })
  }

  put (items) {
    return dynamoPromise(this.client, 'batchWrite', {
      RequestItems: this.tables.reduce((obj, table, index) => {
        obj[table.name] = [{
          PutRequest: {
            Item: items[index]
          }
        }]
        return obj
      }, {})
    })
  }
}

class Table {
  constructor (tableName, client) {
    this.name = tableName
    this.client = client
    return this
  }

  get (key) {
    return dynamoPromise(this.client, 'get', {
      Key: key,
      TableName: this.name
    })
  }

  put (item) {
    return dynamoPromise(this.client, 'put', {
      Item: item,
      TableName: this.name
    })
  }

  delete (key) {
    return dynamoPromise(this.client, 'delete', {
      Key: key,
      TableName: this.name
    })
  }
}

Sparkplug.Table = Table
Sparkplug.Batch = Batch
module.exports = Sparkplug
