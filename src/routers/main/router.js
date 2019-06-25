'use strict';

const express = require('express');

const GET = require('./methods/get');
const POST = require('./methods/post');
const PUT = require('./methods/put');
const DELETE = require('./methods/delete');

const chamber = require('../../chamber');



const router = express.Router();



/* --- GET Routes --- */

router.get('/', GET.welcome);
router.get('/signout', GET.sign_out);
router.get('/check_session', GET.check_session);
router.get('/get_random_users', GET.get_random_users);
router.get('/get_user_by_id/:id', GET.get_user_by_id);
router.get('/get_user_by_username/:username', GET.get_user_by_username);
router.get('/get_user_reviews/:user_id', GET.get_user_reviews);
router.get('/get_user_reviews/:user_id/:review_id', GET.get_user_reviews);

router.get('/get_user_recipes/:owner_id', GET.get_user_recipes);
router.get('/get_user_recipes/:owner_id/:recipe_id', GET.get_user_recipes);
router.get('/get_recipe_by_id/:recipe_id', GET.get_recipe_by_id);
router.get('/check_cook_request/:recipe_id/:user_id', GET.check_cook_request);
router.get('/check_recipe_cook_requests/:recipe_id', GET.check_recipe_cook_requests);
router.get('/check_recipe_cook_requests/:recipe_id/:cook_request_id', GET.check_recipe_cook_requests);
router.get('/get_cook_request_updates/:recipe_id', GET.get_cook_request_updates);
router.get('/get_cook_request_updates/:recipe_id/:recipe_tracking_update_id', GET.get_cook_request_updates);
router.get('/get_search_recipes', GET.get_search_recipes);


/* --- POST Routes --- */

router.post('/sign_up', POST.sign_up);

router.post('/create_recipe', chamber.SessionRequired, POST.create_recipe);
router.post('/create_review', chamber.SessionRequired, POST.create_review);
router.post('/submit_reset_password_request', chamber.SessionRequired, POST.submit_reset_password_request);
router.post('/toggle_cook_request/:recipe_id/:user_id', chamber.SessionRequired, POST.toggle_cook_request);
router.post('/add_cook_request_update/:recipe_id', chamber.SessionRequired, POST.add_cook_request_update);


/* --- PUT Routes --- */

router.put('/sign_in', PUT.sign_in);
router.put('/sign_out', PUT.sign_out);

router.put('/change_user_password', chamber.SessionRequired, PUT.change_user_password);
router.put('/update_icon', chamber.SessionRequired, PUT.update_icon);
router.put('/update_info', chamber.SessionRequired, PUT.update_info);
router.put('/update_email', chamber.SessionRequired, PUT.update_email);
router.put('/update_paypal_email', chamber.SessionRequired, PUT.update_paypal_email);
router.put('/update_recipe/:recipe_id', chamber.SessionRequired, PUT.update_recipe);
router.put('/submit_password_reset_code', chamber.SessionRequired, PUT.submit_password_reset_code);
router.put('/accept_recipe_cook_request/:recipe_cook_request_id', chamber.SessionRequired, PUT.accept_recipe_cook_request);



/* --- DELETE Routes --- */

// router.delete('/delete_recipe/:recipe_id', chamber.SessionRequired, DELETE.delete_recipe);
router.delete('/delete_review/:review_id', chamber.SessionRequired, DELETE.delete_review);



/* --- exports --- */

module.exports = {
  router,
}
