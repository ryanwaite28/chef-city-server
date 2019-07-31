'use strict';

const express = require('express');
const GET = require('./methods/get');
const POST = require('./methods/post');
const PUT = require('./methods/put');
const DELETE = require('./methods/delete');
const chamber = require('../../chamber');



const users_router = require('./model-routers/users/users.router').router;
const user_ratings_router = require('./model-routers/user_ratings/user_ratings.router').router;
const follows_router = require('./model-routers/follows/follows.router').router;
const follow_requests_router = require('./model-routers/follow_requests/follow_requests.router').router;
const recipes_router = require('./model-routers/recipes/recipes.router').router;
const recipe_likes_router = require('./model-routers/recipe_likes/recipe_likes.router').router;
const recipe_comments_router = require('./model-routers/recipe_comments/recipe_comments.router').router;
const comment_likes_router = require('./model-routers/comment_likes/comment_likes.router').router;
const recipe_pictures_router = require('./model-routers/recipe_pictures/recipe_pictures.router').router;
const cook_requests_router = require('./model-routers/cook_requests/cook_requests.router').router;
const cook_request_updates_router = require('./model-routers/cook_request_updates/cook_request_updates.router').router;
const cook_request_update_pictures_router = require('./model-routers/cook_request_update_pictures/cook_request_update_pictures.router').router;
const cook_request_disputes_router = require('./model-routers/cook_request_disputes/cook_request_disputes.router').router;
const cook_request_dispute_pictures_router = require('./model-routers/cook_request_dispute_pictures/cook_request_dispute_pictures.router').router;
const dispute_logs_router = require('./model-routers/dispute_logs/dispute_logs.router').router;
const dispute_log_pictures_router = require('./model-routers/dispute_log_pictures/dispute_log_pictures.router').router;
const notifications_router = require('./model-routers/notifications/notifications.router').router;
const conversations_router = require('./model-routers/conversations/conversations.router').router;
const conversation_members_router = require('./model-routers/conversation_members/conversation_members.router').router;
const conversation_messages_router = require('./model-routers/conversation_messages/conversation_messages.router').router;
const message_senders_router = require('./model-routers/message_senders/message_senders.router').router;
const messages_router = require('./model-routers/messages/messages.router').router;



const router = express.Router();

router.use('/users', users_router);
router.use('/user_ratings', user_ratings_router);
router.use('/follows', follows_router);
router.use('/follow_requests', follow_requests_router);
router.use('/recipes', recipes_router);
router.use('/recipe_likes', recipe_likes_router);
router.use('/recipe_comments', recipe_comments_router);
router.use('/comment_likes', comment_likes_router);
router.use('/recipe_pictures', recipe_pictures_router);
router.use('/cook_requests', cook_requests_router);
router.use('/cook_request_updates', cook_request_updates_router);
router.use('/cook_request_update_pictures', cook_request_update_pictures_router);
router.use('/cook_request_disputes', cook_request_disputes_router);
router.use('/cook_request_dispute_pictures', cook_request_dispute_pictures_router);
router.use('/dispute_logs', dispute_logs_router);
router.use('/dispute_log_pictures', dispute_log_pictures_router);
router.use('/notifications', notifications_router);
router.use('/conversations', conversations_router);
router.use('/conversation_members', conversation_members_router);
router.use('/conversation_messages', conversation_messages_router);
router.use('/message_senders', message_senders_router);
router.use('/messages', messages_router);



/* --- GET Routes --- */

router.get('/', GET.welcome);
router.get('/signout', GET.sign_out);
router.get('/check_session', GET.check_session);
router.get('/get_random_users', GET.get_random_users);
router.get('/get_random_recipes', GET.get_random_recipes);
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
router.post('/submit_reset_password_request', chamber.SessionRequired, POST.submit_reset_password_request);


/* --- PUT Routes --- */

router.put('/sign_in', PUT.sign_in);
router.put('/sign_out', PUT.sign_out);

// router.put('/change_user_password', chamber.SessionRequired, PUT.change_user_password);
// router.put('/update_icon', chamber.SessionRequired, PUT.update_icon);
// router.put('/update_info', chamber.SessionRequired, PUT.update_info);
// router.put('/update_email', chamber.SessionRequired, PUT.update_email);
// router.put('/update_paypal_email', chamber.SessionRequired, PUT.update_paypal_email);

router.put('/submit_password_reset_code', chamber.SessionRequired, PUT.submit_password_reset_code);



/* --- DELETE Routes --- */





/* --- exports --- */

module.exports = {
  router,
}
