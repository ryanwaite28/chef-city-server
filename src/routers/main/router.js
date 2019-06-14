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
// router.get('/get_user_by_id/:id', GET.get_user_by_id);
router.get('/get_user_by_username/:username', GET.get_user_by_username);
router.get('/get_user_reviews/:user_id', GET.get_user_reviews);
router.get('/get_user_reviews/:user_id/:review_id', GET.get_user_reviews);

// router.get('/get_user_packages/:owner_id', GET.get_user_packages);
// router.get('/get_user_packages/:owner_id/:package_id', GET.get_user_packages);
// router.get('/get_user_delivering/:helper_id', GET.get_user_delivering);
// router.get('/get_user_delivering/:helper_id/:package_id', GET.get_user_delivering);
// router.get('/get_package_by_id/:package_id', GET.get_package_by_id);
// router.get('/check_delivery_request/:package_id/:user_id', GET.check_delivery_request);
// router.get('/check_package_delivery_requests/:package_id', GET.check_package_delivery_requests);
// router.get('/check_package_delivery_requests/:package_id/:delivery_request_id', GET.check_package_delivery_requests);
// router.get('/get_package_tracking_updates/:package_id', GET.get_package_tracking_updates);
// router.get('/get_package_tracking_updates/:package_id/:package_tracking_update_id', GET.get_package_tracking_updates);
// router.get('/get_search_packages', GET.get_search_packages);


/* --- POST Routes --- */

router.post('/sign_up', POST.sign_up);

router.post('/create_package', chamber.SessionRequired, POST.create_package);
router.post('/create_review', chamber.SessionRequired, POST.create_review);
router.post('/submit_reset_password_request', chamber.SessionRequired, POST.submit_reset_password_request);
// router.post('/toggle_delivery_request/:package_id/:user_id', chamber.SessionRequired, POST.toggle_delivery_request);
// router.post('/add_package_tracking_update/:package_id', chamber.SessionRequired, POST.add_package_tracking_update);


/* --- PUT Routes --- */

router.put('/sign_in', PUT.sign_in);
router.put('/sign_out', PUT.sign_out);

router.put('/change_user_password', chamber.SessionRequired, PUT.change_user_password);
router.put('/update_icon', chamber.SessionRequired, PUT.update_icon);
router.put('/update_info', chamber.SessionRequired, PUT.update_info);
router.put('/update_email', chamber.SessionRequired, PUT.update_email);
router.put('/update_paypal_email', chamber.SessionRequired, PUT.update_paypal_email);
// router.put('/update_package/:package_id', chamber.SessionRequired, PUT.update_package);
// router.put('/submit_password_reset_code', chamber.SessionRequired, PUT.submit_password_reset_code);
// router.put('/accept_package_delivery_request/:package_delivery_request_id', chamber.SessionRequired, PUT.accept_package_delivery_request);
// router.put('/package_mark_as_delivered/:package_id', chamber.SessionRequired, PUT.package_mark_as_delivered);



/* --- DELETE Routes --- */

router.delete('/delete_review/:review_id', chamber.SessionRequired, DELETE.delete_review);



/* --- exports --- */

module.exports = {
  router
}
