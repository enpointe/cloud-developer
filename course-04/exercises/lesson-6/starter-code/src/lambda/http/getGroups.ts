import 'source-map-support/register'
import { getAllGroups } from '../../businessLogic/groups';

import * as express from 'express'
const awsServerlessExpress = require('aws-serverless-express')

const app = express()

app.get('/groups', async (_req, res) => {
  console.log('Processing event: ', event)

  const groups = await getAllGroups()

  // Return a list of groups
  res.json({
    items: groups
  })
})

const server = awsServerlessExpress.createServer(app)
exports.handler = (event, context) => { awsServerlessExpress.proxy(server, event, context) }