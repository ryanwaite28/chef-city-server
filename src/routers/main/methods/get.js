'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const models = require('../../../models').models;
const chamber = require('../../../chamber');



/* --- GET Functions --- */

function welcome(request, response) {
  return response.json({ msg: 'Chef City API' });
}

function sign_out(request, response) {
  request.session.reset();
  return response.json({ online: false, successful: true, message: "Signed out successfully!" });
}

function check_session(request, response) {
  (async function() {
    try {
      if(request.session.id){
        var get_user = await models.Users.findOne({ where: { id: request.session.you.id } });
        var user = get_user.dataValues;
        delete user['password'];
        var session_id = request.session.id;
        return response.json({ online: true, session_id, user });
      }
      else {
        let auth = request.get('Authorization'); // user's token
        if(!auth) { return response.json({ error: true, online: false, message: 'No Authorization header' }); }
        let token_record = await models.Tokens.findOne({ where: { token: auth } });
        if(!token_record) { return response.json({ error: true, online: false, message: 'Auth token is invalid...' }); }
        let token = token_record.dataValues;
        if(token.ip_address !== request.ip || token.user_agent !== request.get('user-agent')) {
          return response.json({ error: true, online: false, message: 'Token used from invalid client...' });
        }
        let get_user = await models.Users.findOne({ where: { id: token.user_id } });
        let user = get_user.dataValues;
        delete user['password'];
        return response.json({ online: true, user, token: token.token });
      }
    }
    catch(e) {
      console.log('error: ', e);
      return response.json({ e, error: true });
    }
  })()
}

function get_user_by_username(request, response) {
  let { username } = request.params;
  models.Users.findOne({ where: { username } })
  .then(u => {
    if (u) {
      let user = u.dataValues;
      delete user['password'];
      return response.json({ user });
    } else {
      return response.json({ error: true, message: 'no user found', user: null });
    }
  })
}

function get_user_by_id(request, response) {
  let { id } = request.params;
  models.Users.findOne({ where: { id } })
  .then(u => {
    if (u) {
      let user = u.dataValues;
      delete user['password'];
      return response.json({ user });
    } else {
      return response.json({ error: true, message: 'no user found', user: null });
    }
  })
}

function get_user_reviews(request, response) {
  let { user_id, review_id } = request.params;
  models.UserRatings.findAll({
    where: (!review_id ? { user_id } : { user_id, id: { [Op.lt]: review_id } }),
    include: [{
      model: models.Users,
      as: 'writer',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [["id","DESC"]]
  })
  // .then(resp => {
  //   let promise_list = resp.map(i => {
  //     let data = i.get({plain: true});
  //     return models.Users.findOne({ where: { id: data.writer_id } }).then(u => {
  //       data.writer = u.dataValues;
  //       return data;
  //     })
  //   })
  //   return Promise.all(promise_list);
  // })
  .then(values => {
    return response.json({ reviews: values });
  })
}

function get_recipe_by_id(request, response) {
  let { recipe_id } = request.params;
  models.Recipes.findOne({
    where: { id: recipe_id },
    include: [{
      model: models.Users,
      as: 'owner',
      attributes: { exclude: ['password'] }
    }]
  })
  // .then(recipe_model => {
  //   console.log('recipe_model', recipe_model);
  //   return models.Users.findOne({ where: { id: recipe_model.dataValues.owner_id } }).then(u => {
  //     return { ...recipe_model.dataValues, owner: { ...u.dataValues } }
  //   })
  // })
  .then(recipeData => {
    return response.json({ recipeData });
  })
  .catch(error => {
    console.log(error);
    return response.json({ error: true, recipeData: null });
  })
}

function get_user_recipes(request, response) {
  let { owner_id, recipe_id } = request.params;
  models.Recipes.findAll({
    where: (!recipe_id ? { owner_id } : { owner_id, id: { [Op.lt]: recipe_id } }),
    include: [{
      model: models.Users,
      as: 'owner',
      attributes: { exclude: ['password'] }
    }, {
      model: models.Users,
      as: 'helper',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [["id","DESC"]]
  })
  .then(recipes => {
    return response.json({ recipes });
  })
}

function get_random_users(request, response) {
  models.Users.findAll({
    limit: 10,
    order: [Sequelize.fn( 'RANDOM' )],
    attributes: [
      Sequelize.fn( 'RANDOM' ),
      'id',
      'displayname',
      'username',
      'icon_link',
      'uuid',
      'createdAt',
      'updatedAt',
    ]
  })
  .then(resp => {
    let list = resp.map(i => i.get({plain: true}));
    return response.json({ users: list });
  })
}

function check_cook_request(request, response) {
  const recipe_id = parseInt(request.params.recipe_id);
  const chef_id = parseInt(request.params.chef_id);
  models.CookRequests.findOne({ where: { recipe_id, chef_id } })
  .then(resp => {
    return response.json({ deliver_request: resp && resp.dataValues || resp });
  })
}

function check_recipe_cook_requests(request, response) {
  const { recipe_id, cook_request_id } = request.params;
  
  models.CookRequests.findAll({
    where: (!cook_request_id ? { recipe_id } : { recipe_id, id: { [Op.lt]: cook_request_id } }),
    include: [{
      model: models.Users,
      attributes: { exclude: ['password'] },
      as: 'user'
    }],
    limit: 5,
    order: [["id","DESC"]]
  })
  .then(recipe_cook_requests => {
    return response.json({ recipe_cook_requests });
  })
}

function get_cook_request_updates(request, response) {
  const { recipe_id, cook_request_update_id } = request.params;
  
  models.CookRequestUpdates.findAll({
    where: (!cook_request_update_id ? { recipe_id } : { recipe_id, id: { [Op.lt]: cook_request_update_id } }),
    limit: 5,
    order: [["id","DESC"]]
  })
  .then(cook_request_updates => {
    return response.json({ cook_request_updates });
  })
  .catch(error => {
    console.log(error);
    return response.json({ e: error, error: true, message: 'could not complete query...' });
  })
}

function get_search_recipes(request, response) {
  (async function(){
    const origin = request.query.origin;
    const destination = request.query.destination;
    const urgent = request.query.urgent && request.query.urgent === '1' && true || false;

    const query = { urgent };
    if (origin) {
      query.origin = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('location_from')),
        'LIKE', '%' + origin + '%'
      );
    }
    if (destination) {
      query.destination = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('location_to')),
        'LIKE', '%' + destination + '%'
      );
    }

    console.log(query);

    const searchResults = await models.Recipes.findAll({
      limit: 10,
      where: query,
      include: [{
        model: models.Users,
        as: 'owner',
        attributes: { exclude: ['password'] }
      }],
    });

    return response.json({
      recipes: searchResults
    });
  })()
}



/*  Exports  */

module.exports = {
  welcome,
  sign_out,
  check_session,
  get_user_by_username,
  get_user_by_id,
  get_user_reviews,
  get_user_recipes,
  get_random_users,
  get_recipe_by_id,
  check_cook_request,
  check_recipe_cook_requests,
  get_cook_request_updates,
  get_search_recipes,
}
