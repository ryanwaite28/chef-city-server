'use strict';

const express = require('express');
const chamber = require('../../../../chamber');
const models = require('../../../../models').models;

const router = express.Router();

router.get('/', (request, response) => {
  
});

router.post('/', chamber.SessionRequired, (request, response) => {

});

router.put('/', chamber.SessionRequired, (request, response) => {

});

router.delete('/', chamber.SessionRequired, (request, response) => {

});

module.exports = {
  router,
}