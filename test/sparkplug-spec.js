/* eslint no-unused-expressions: 0 */
const {expect} = require('chai')
const {DynamoDB} = require('aws-sdk')
const dynalite = require('dynalite')
const Sparkplug = require('../index')

let server = null

const config = {
  region: 'localhost',
  endpoint: 'http://localhost:4567'
}

const dynamodb = new DynamoDB(config)
const client = new DynamoDB.DocumentClient(config)

const ACCOUNT_TABLE = 'accounts'
const ORG_TABLE = 'organizations'

const accountSchema = {
  TableName: ACCOUNT_TABLE,
  AttributeDefinitions: [{
    AttributeName: 'email',
    AttributeType: 'S'
  }, {
    AttributeName: 'name',
    AttributeType: 'S'
  }],
  GlobalSecondaryIndexes: [{
    IndexName: 'name',
    KeySchema: [{
      AttributeName: 'name',
      KeyType: 'HASH'
    }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    Projection: {
      ProjectionType: 'ALL'
    }
  }],
  KeySchema: [{
    AttributeName: 'email',
    KeyType: 'HASH'
  }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  }
}

const organizationSchema = {
  TableName: ORG_TABLE,
  AttributeDefinitions: [{
    AttributeName: 'name',
    AttributeType: 'S'
  }],
  KeySchema: [{
    AttributeName: 'name',
    KeyType: 'HASH'
  }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  }
}

describe('Sparkplug', () => {
  beforeEach((done) => {
    server = dynalite({createTableMs: 0})
    server.listen(4567, (err) => {
      if (err) throw err
      dynamodb.createTable(accountSchema, (err, data) => {
        if (err) throw err
        dynamodb.createTable(organizationSchema, (err, data) => {
          if (err) throw err
          done()
        })
      })
    })
  })

  afterEach((done) => {
    server.close((err) => {
      if (err) throw err
      server = null
      done()
    })
  })

  describe('Table', () => {
    describe('get', () => {
      it('should get an item from the db w/primary key', (done) => {
        client.put({
          TableName: ACCOUNT_TABLE,
          Item: {
            email: 'johnny.quest@example.com',
            name: 'Johnny Quest',
            id: 12345
          }
        }, (err) => {
          if (err) throw err
          new Sparkplug(config)
            .table(ACCOUNT_TABLE)
            .get({email: 'johnny.quest@example.com'})
            .then((resp) => {
              expect(resp.email).to.equal('johnny.quest@example.com')
              expect(resp.name).to.equal('Johnny Quest')
              expect(resp.id).to.equal(12345)
              done()
            })
            .catch((err) => {
              done(err)
            })
        })
      })
    })

    describe('delete', () => {
      it('should delete an item from the db w/primary key', (done) => {
        client.put({
          TableName: ACCOUNT_TABLE,
          Item: {
            email: 'johnny.quest@example.com',
            name: 'Johnny Quest',
            id: 12345
          }
        }, (err) => {
          if (err) throw err
          new Sparkplug(config)
            .table(ACCOUNT_TABLE)
            .delete({email: 'johnny.quest@example.com'})
            .then((resp) => {
              client.get({
                TableName: ACCOUNT_TABLE,
                Key: {email: 'johnny.quest@example.com'}
              }, (err, response) => {
                expect(err).to.be.a('null')
                expect(response).to.be.an('object').that.is.empty
                done()
              })
            })
            .catch((err) => {
              done(err)
            })
        })
      })
    })

    describe('put', () => {
      it('should put an item into the db', (done) => {
        new Sparkplug(config)
          .table(ACCOUNT_TABLE)
          .put({
            email: 'johnny.quest@example.com',
            name: 'Johnny Quest',
            id: 12345
          })
          .then((resp) => {
            client.get({
              TableName: ACCOUNT_TABLE,
              Key: {email: 'johnny.quest@example.com'}
            }, (err, response) => {
              expect(err).to.be.a('null')
              expect(response.Item.email).to.equal('johnny.quest@example.com')
              expect(response.Item.name).to.equal('Johnny Quest')
              expect(response.Item.id).to.equal(12345)
              done()
            })
          })
          .catch((err) => {
            done(err)
          })
      })
    })
  })

  describe('Batch', () => {
    describe('get', () => {
      it('should get multiple items from the db', (done) => {
        let obj = {}
        obj[ACCOUNT_TABLE] = [{
          PutRequest: {
            Item: {
              email: 'johnny.quest@example.com',
              name: 'Johnny Quest',
              id: 12345
            }
          }
        }]
        obj[ORG_TABLE] = [{
          PutRequest: {
            Item: {
              name: 'Github',
              id: 45678
            }
          }
        }]

        client.batchWrite({RequestItems: obj}, (err) => {
          if (err) throw err
          const sparkplug = new Sparkplug(config)
          const accounts = sparkplug.table(ACCOUNT_TABLE)
          const orgs = sparkplug.table(ORG_TABLE)
          sparkplug
            .batch()
            .get(accounts, {email: 'johnny.quest@example.com'})
            .get(orgs, {name: 'Github'})
            .exec()
            .then(({accounts, organizations}) => {
              expect(accounts[0].name).to.equal('Johnny Quest')
              expect(organizations[0].id).to.equal(45678)
              done()
            }).catch((err) => {
              done(err)
            })
        })
      })
    })

    describe('put', () => {
      it('should put multiple items in the db', (done) => {
        let obj = {}
        obj[ACCOUNT_TABLE] = {Keys: [
          {email: 'johnny.quest@example.com'},
          {email: 'batman@example.com'}
        ]}
        obj[ORG_TABLE] = {Keys: [{name: 'Github'}]}

        const sparkplug = new Sparkplug(config)
        const accounts = sparkplug.table(ACCOUNT_TABLE)
        const orgs = sparkplug.table(ORG_TABLE)
        sparkplug.batch().put(accounts, [{
          email: 'johnny.quest@example.com',
          name: 'Johnny Quest',
          id: 12345
        }, {
          email: 'batman@example.com',
          name: 'Bruce Wayne',
          id: 54221
        }])
          .put(orgs, {
            name: 'Github',
            id: 45678
          })
          .exec()
          .then((resp) => {
            client.batchGet({
              RequestItems: obj
            }, (err, response) => {
              if (err) throw err
              expect(response.Responses.accounts.length).to.equal(2)
              expect(response.Responses.organizations[0].id).to.equal(45678)
              done()
            })
          }).catch((err) => {
            done(err)
          })
      })
    })

    describe('delete', () => {
      it('should batch delete', (done) => {
        const sparkplug = new Sparkplug(config)
        const accounts = sparkplug.table(ACCOUNT_TABLE)
        accounts.put({
          email: 'johnny.quest@example.com',
          name: 'Johnny Quest',
          id: 12345
        })
          .then((resp) => {
            return sparkplug
              .batch()
              .delete(accounts, {email: 'johnny.quest@example.com'})
              .exec()
          })
          .then((resp) => {
            return accounts.get({email: 'johnny.quest@example.com'})
          })
          .then((resp) => {
            expect(resp).to.be.an('object').that.is.empty
            done()
          })
          .catch((err) => {
            done(err)
          })
      })
    })

    it('should be able to get/put at the same time', (done) => {
      const sparkplug = new Sparkplug(config)
      const accounts = sparkplug.table(ACCOUNT_TABLE)
      const orgs = sparkplug.table(ORG_TABLE)
      accounts
        .put({
          email: 'johnny.quest@example.com',
          name: 'Johnny Quest',
          id: 12345
        })
        .then((resp) => {
          return new Sparkplug(config)
            .batch()
            .get(accounts, {email: 'johnny.quest@example.com'})
            .put(orgs, [{
              name: 'Github',
              id: 45678
            }, {
              name: 'E Corp',
              id: 84758
            }])
            .exec()
        })
        .then((response) => {
          expect(response[0].accounts[0].email)
            .to.equal('johnny.quest@example.com')
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe('Query', () => {
    it('should allow queries via object', (done) => {
      const sparkplug = new Sparkplug(config)
      const accounts = sparkplug.table(ACCOUNT_TABLE)
      sparkplug.batch().put(accounts, [{
        email: 'johnny.quest@example.com',
        name: 'Johnny Quest',
        id: 12345
      }, {
        email: 'batman@example.com',
        name: 'Bruce Wayne',
        id: 54221
      }])
      .exec()
      .then((resp) => {
        return accounts
          .query({name: 'Bruce Wayne'})
          .on('name')
          .exec()
      })
      .then((resp) => {
        expect(resp[0].id).to.equal(54221)
        return accounts
          .query('#name = :name', {':name': 'Bruce Wayne'}, {'#name': 'name'})
          .on('name')
          .reverse()
          .limit(1)
          .exec()
      })
      .then((resp) => {
        expect(resp[0].id).to.equal(54221)
        return accounts
          .query({email: 'johnny.quest@example.com'})
          .strongRead()
          .exec()
      })
      .then((resp) => {
        expect(resp[0].id).to.equal(12345)
        done()
      })
      .catch((err) => {
        done(err)
      })
    })
  })

  describe('Scan', () => {
    it('should allow scans via object', (done) => {
      const sparkplug = new Sparkplug(config)
      const accounts = sparkplug.table(ACCOUNT_TABLE)
      sparkplug.batch().put(accounts, [{
        email: 'johnny.quest@example.com',
        name: 'Johnny Quest',
        id: 12345
      }, {
        email: 'batman@example.com',
        name: 'Bruce Wayne',
        id: 54221
      }])
      .exec()
      .then((resp) => {
        return accounts
          .scan({name: 'Bruce Wayne'})
          .exec()
      })
      .then((resp) => {
        expect(resp[0].id).to.equal(54221)
        done()
      })
      .catch((err) => {
        done(err)
      })
    })
  })

  it('should catch dynamodb errors', (done) => {
    new Sparkplug(config)
      .table('not_a_table')
      .get({llamas: 1})
      .then(() => {})
      .catch((err) => {
        expect(err).to.be.an('error')
        done()
      })
  })
})
