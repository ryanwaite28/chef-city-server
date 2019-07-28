'use strict';

const express = require('express');
const chamber = require('../../../../chamber');
const models = require('../../../../models').models;
const cloudinary_manager = require('../../../../cloudinary_manager');
const sendgrid_manager = require('../../../../sendgrid_manager');

const router = express.Router();

router.get('/', (request, response) => {

});

router.get('/:id', async (request, response) => {
  const id = parseInt(request.params.id);
  const recipeModel = await models.Recipes.findOne({
    where: { id },
    include: [{
      model: models.Users,
      as: 'creator',
      attributes: [
        'id', 
        'displayname', 
        'username',
        'email',
        'icon_link',
      ]
    }]
  });
  
  response.status(200).json({ recipe: recipeModel });
});

router.post('/', chamber.SessionRequired, async (request, response) => {
  const title = request.body['recipe-title'];
  const desc = request.body['recipe-description'];
  const ingredients = request.body['recipe-ingredients'];
  const tags = request.body['recipe-tags'];
  
  if(!title) {
    return response.status(400).json({
      error: true,
      message: 'title is required'
    });
  }
  if(!desc) {
    return response.status(400).json({
      error: true,
      message: 'description is required'
    });
  }
  if(!ingredients) {
    return response.status(400).json({
      error: true,
      message: 'ingredients is required'
    });
  }
  if(!tags) {
    return response.status(400).json({
      error: true,
      message: 'tags is required'
    });
  }

  const creationObj = {
    creator_id: response.locals.you.id,
    title,
    desc,
    ingredients,
    tags,
  };

  const image = request.files && request.files['recipe-image'];
  if(image) {
    const type = image.mimetype.split('/')[1];
    if(!chamber.allowed_images.includes(type)) {
      return response.status(400).json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
    } else {
      try {
        const imgData = await cloudinary_manager.store(image, null);
        creationObj.image_id = imgData.result.public_id, 
        creationObj.image_link = imgData.result.secure_url
      } catch(e) {
        // 
      }
    }
  }

  const newRecipeModel = await models.Recipes.create(creationObj);
  const newRecipe = {
    ...newRecipeModel.dataValues,
    creator: {
      ...response.locals.you
    }
  };

  return response.status(200).json({
    newRecipe,
    message: creationObj.image_id ? 'New recipe created!' : 'New recipe created. image could not be uploaded at this time.'
  });
});

router.put('/', chamber.SessionRequired, (request, response) => {

});

router.delete('/', chamber.SessionRequired, (request, response) => {

});

module.exports = {
  router,
}