'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const models = require('../../../models').models;
const chamber = require('../../../chamber');



/* --- DELETE Functions --- */

function delete_review(request, response) {
  let { review_id } = request.params;
  if(review_id) { review_id = parseInt(review_id); }
  if(!chamber.validateInteger(review_id)) {
    return response.json({ error: true, message: '"review_id" must be integer/number' });
  }
  models.UserRatings.destroy({where: { id: review_id, writer_id: response.locals.you.id }})
  .then(res => {
    return response.json({ res, message: 'Review Deleted!' });
  })
  .catch(error => {
    console.log('error', error);
    return response.json({ error: true, message: 'Could not delete review...' });
  });
}

function delete_package(request, response) {
  let { package_id } = request.params;
  let { helper_id, delivered } = request.body;
  if(package_id) { package_id = parseInt(package_id); }
  if(helper_id && !delivered) {
    return response.json({ error: true, message: 'cannot delete a package that is currently being delivered' });
  }
  if(!chamber.validateInteger(package_id)) {
    return response.json({ error: true, message: '"package_id" is required; must be integer/number' });
  }
  models.Recipes.destroy({where: { id: package_id, owner_id: response.locals.you.id }})
  .then(res => {
    return response.json({ res, message: 'Package Deleted!' });
  })
  .catch(error => {
    console.log('error', error);
    return response.json({ error: true, message: 'Could not delete package...' });
  });
}

function decline_package_delivery_request(request, response) {
  (async function(){
    let { package_delivery_request_id } = request.params;
    if (!package_delivery_request_id) {
      return response.json({ error: true, message: 'missing route data' });
    }
    if (isNaN(package_delivery_request_id)) {
      return response.json({ error: true, message: 'route data is not a number' });
    }

    const delivery_request = await models.DeliveryRequests.findOne({ where: { id: package_delivery_request_id }});
    if (!delivery_request) {
      return response.json({ error: true, message: 'delivery request not found' });
    }

    const packageData = await models.Recipes.findOne({ where: { id: delivery_request.dataValues.package_id }});
    if (!packageData) {
      return response.json({ error: true, message: 'package not found' });
    }
    if (packageData.dataValues.owner_id !== response.locals.you.id) {
      return response.json({ error: true, message: 'user does not own this package' });
    }

    await models.DeliveryRequests.destroy({ where: { id: package_delivery_request_id }});

    request.io.emit(`for:user-${delivery_request.dataValues.user_id}`, { 
      message: `Delivery request declined`,
      packageData, 
    });

    return response.json({ message: 'Request declined successfully!' });
  })()
}



/* --- Exports --- */

module.exports = {
  delete_review,
  delete_package,
  decline_package_delivery_request
}
