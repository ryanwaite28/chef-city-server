'use strict';

const express = require('express');
const chamber = require('../../../../chamber');
const models = require('../../../../models').models;
const cloudinary_manager = require('../../../../cloudinary_manager');
const sendgrid_manager = require('../../../../sendgrid_manager');

const router = express.Router();

/** */

const getUserRouteHandler = async (request, response) => {
  const id = parseInt(request.params.id);
  const userModel = await models.Users.findOne({
    where: { id },
    attributes: [
      'id', 
      'displayname', 
      'username',
      'email',
      'icon_link',
      'phone',
      'bio',
      'location',
      'link',
      'uuid',
      'date_created',
      'public',
      'verified',
      'confirmed',
    ],
  });
  
  response.status(200).json({ user: userModel });
};

const getUserRecipesRouteHandler = async (request, response) => {
  const { id, recipe_id } = request.params;
  const recipesModels = await models.Recipes.findAll({
    where: (!recipe_id ? { creator_id: id } : { creator_id: id, id: { [Op.lt]: recipe_id } }),
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
    }],
    limit: 5,
    order: [["id","DESC"]]
  })

  return response.status(200).json({ recipes: recipesModels });
};

const postUserRouteHandler = async (request, response) => {
  
};

const putUserRouteHandler = async (request, response) => {
  const id = parseInt(request.params.id);
  if (id !== request.session.you.id) {
    return response.status(400).json({
      error: true,
      message: `not authorized...`,
    });
  }
  const image = request.files && request.files['profile-image'];
  if (!image) {
    return response.status(400).json({
      error: true,
      message: `no file with name 'profile-image' was found...`,
    });
  }
  const type = image.mimetype.split('/')[1];
  if(!chamber.allowed_images.includes(type)) {
    return response.status(400).json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
  }
  try {
    const imgData = await cloudinary_manager.store(image, request.session.you.icon_id);
    const updateObj = { icon_link: imgData.result.secure_url, icon_id: imgData.result.public_id };
    await models.Users.updateObj(updateObj, { where: { id: request.session.you.id } });
    Object.assign(request.session.you, updateObj);
    return response.status(400).json({ 
      error: true, 
      message: 'Invalid file type: jpg, jpeg or png required...',
      new_icon_link:  updateObj.icon_link,
    });
  } catch(e) {
    // 
    return response.status(500).json({ error: true, message: 'Could not process this request at this time...' });
  }
};

const deleteUserRouteHandler = async (request, response) => {
  
};

/** */

router.get('/:id', getUserRouteHandler);

router.get('/:id/recipes', getUserRecipesRouteHandler);
router.get('/:id/recipes/:recipe_id', getUserRecipesRouteHandler);

router.post('/', chamber.SessionRequired, postUserRouteHandler);

router.put('/:id', chamber.SessionRequired, putUserRouteHandler);

router.delete('/:id', chamber.SessionRequired, deleteUserRouteHandler);

module.exports = {
  router,
}