'use strict';

const bcrypt = require('bcrypt-nodejs');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const models = require('../../../models').models;
const chamber = require('../../../chamber');
const templateEngine = require('../../../templateEngine');
const cloudinary_manager = require('../../../cloudinary_manager');
const sendgrid_manager = require('../../../sendgrid_manager');



/* --- POST Functions --- */

function sign_up(request, response) {
  (async function() {
    if(request.session.id) { return response.json({ error: true, message: "Client already signed in" }) }

    var { displayname, username, email, password, confirmPassword } = request.body;
    if(email) { email = email.toLowerCase().trim(); }
    if(username) { username = username.toLowerCase().trim(); }

    if(!displayname) {
      return response.json({ error: true, message: 'Display Name field is required' });
    }
    if(!username) {
      return response.json({ error: true, message: 'Username field is required' });
    }
    if(!email) {
      return response.json({ error: true, message: 'Email Address field is required' });
    }
    if(!password) {
      return response.json({ error: true, message: 'Password field is required' });
    }
    if(!confirmPassword) {
      return response.json({ error: true, message: 'Confirm Password field is required' });
    }

    if(!chamber.validateDisplayName(displayname)) {
      return response.json({ error: true, message: 'Display name must be letters only, 2-50 characters long. Spaces, dashes and apostrophes are allowed' });
    }
    if(!chamber.validateUsername(username)) {
      return response.json({ error: true, message: 'Username must be letters and numbers only, 2-50 characters long. Dashes and underscores are allowed' });
    }
    if(!chamber.validateEmail(email)) {
      return response.json({ error: true, message: 'Email is invalid. Check Format.' });
    }
    if(!chamber.validatePassword(password)) {
      return response.json({
        error: true,
        message: 'Password must be: at least 7 characters, upper and/or lower case alphanumeric'
      });
    }
    if(password !== confirmPassword) {
      return response.json({ error: true, message: 'Passwords must match' });
    }

    const check_username = await models.Users.findOne({ where: { username } });
    if(check_username) {
      return response.json({ error: true, message: 'Username already in use' });
    }

    const check_email = await models.Users.findOne({ where: { email } });
    if(check_email) {
      return response.json({ error: true, message: 'Email already in use' });
    }

    /* Data Is Valid */

    password = bcrypt.hashSync(password);
    let new_user = await models.Users.create({ displayname, username, email, password });
    let user = new_user.dataValues;
    let new_token = chamber.generateToken(user.id);
    models.Tokens.create({ 
      ip_address: request.ip, 
      user_agent: request.get('user-agent'), 
      user_id: user.id, 
      token: new_token,
      device: request.device.type
    });
    delete user['password'];
    request.session.id = chamber.uniqueValue();
    request.session.you = user;

    // // send verification email
    let host = request.get('host');
    let uuid = user.uuid;
    let verify_link = host.endsWith('/') ?
    (host + 'verify_user_email/' + uuid) :
    (host + '/verify_user_email/' + uuid);

    let email_subject = 'DeliverMe - Signed Up!';
    let email_html = templateEngine.SignedUp_EMAIL(request.session.you);
    sendgrid_manager.send_email(null, user.email, email_subject, email_html);

    return response.json({ online: true, user, message: 'Signed Up!', token: new_token });
  })()
}

function sign_out(request, response) {
  request.session.reset();
  return response.json({ online: false, successful: true });
}

function create_review(request, response) {
  (async function(){
    try {
      let image_file = request.files && request.files.image_file || null;
      if(image_file) {
        let type = image_file.mimetype.split('/')[1];
        if(!chamber.allowed_images.includes(type)) {
          return response.json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
        }
      }

      let { rating, title, summary, user_id } = JSON.parse(request.body.json_data);
      if(!user_id) {
        return response.json({ error: true, message: 'User ID is required' });
      }
      if(user_id === response.locals.you.id) {
        return response.json({ error: true, message: 'User ID cannot be your ID' });
      }
      if(!rating) {
        return response.json({ error: true, message: 'Rating field is required; must be only a number, 1-5' });
      } else {
        rating = parseInt(rating);
      }
      if(!summary) {
        return response.json({ error: true, message: 'Summary field is required; Mmaximum length is 500 characters; cannot be empty' });
      } else {
        summary = summary.trim()
      }
      if(!title) {
        return response.json({ error: true, message: 'Title field is required; Mmaximum length is 250 characters; cannot be empty' });
      } else {
        title = title.trim()
      }

      console.log({ image_file, rating, title, summary, user_id, writer_id: response.locals.you.id });
      let new_rating;

      if(image_file) {
        let imgData = await cloudinary_manager.store(image_file, null);
        new_rating = await models.UserRatings.create({ 
          rating, 
          title, 
          summary, 
          user_id, 
          writer_id: response.locals.you.id,
          image_id: imgData.result.public_id, 
          image_link: imgData.result.secure_url
        });
      } else {
        new_rating = await models.UserRatings.create({ rating, title, summary, user_id, writer_id: response.locals.you.id });
      }

      
      // let user = await models.Users.findOne({ where: { id: user_id } });

      const data = new_rating.dataValues;
      const new_review = { 
        ...data, 
        writer: { ...response.locals.you }
      };
      // let you = response.locals.you;
      // data.user = you;

      // // send notification email
      // let host = request.get('host');
      // let profile_link = host.endsWith('/') ? (host + 'users/' + you.username) : (host + '/users/' + you.username);
      // let email_subject = 'Epsity - ' + you.displayname + ' wrote a review about you!';
      // let email_html = templateEngine.NewReview_EMAIL({ you, user, profile_link, review: data });
      // let email_result = await sendgrid_manager.send_email(null, user.email, email_subject, email_html);

      request.io.emit(`for:user-${user_id}`, {
        event: request.EVENT_TYPES.NEW_REVIEW,
        data: new_review
      });

      return response.json({ 
        new_review, 
        message: 'Rating Created!' 
      });
    }
    catch(e) {
      console.log('error', e);
      return response.json({ e, error: true, message: 'Could not create review...' });
    };
  })()
}

function create_package(request, response) {
  (async function(){
    try {
      let {
        title,
        desc,
        location_from,
        location_to,
        category,
        size,
        weight,
        urgent,
        payout,
        penalty,
      } = JSON.parse(request.body.json_data);

      if(!title) {
        return response.json({ error: true, message: 'Title is required' });
      }
      if(!desc || desc.length > 250) {
        return response.json({ error: true, message: 'Description field is required; Mmaximum length is 250 characters; cannot be empty' });
      }
      else {
        desc = desc.trim()
      }
      if(!location_from) {
        return response.json({ error: true, message: 'Location From is required' });
      }
      if(!location_to) {
        return response.json({ error: true, message: 'Location To is required' });
      }
      if(!category) {
        return response.json({ error: true, message: 'Category is required' });
      }
      if(!size) {
        return response.json({ error: true, message: 'Size is required' });
      }
      if(!weight) {
        return response.json({ error: true, message: 'Weight is required' });
      }
      if(!payout) {
        return response.json({ error: true, message: 'Payout is required' });
      }
      if(!penalty) {
        return response.json({ error: true, message: 'Penalty is required' });
      }

      const dataObj = {
        owner_id: response.locals.you.id,
        title,
        desc,
        location_from,
        location_to,
        category,
        size,
        weight,
        urgent,
        payout: parseInt(payout),
        penalty: parseInt(penalty),
      };

      let image_file = request.files && request.files.package_icon_input || null;
      if(image_file) {
        let type = image_file.mimetype.split('/')[1];
        if(!chamber.allowed_images.includes(type)) {
          return response.json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
        } else {
          let imgData = await cloudinary_manager.store(image_file, null);
          dataObj.image_id = imgData.result.public_id, 
          dataObj.image_link = imgData.result.secure_url
        }
      }

      const new_package_model = await models.Packages.create(dataObj);

      const new_package = {
        ...new_package_model.dataValues,
        owner: { ...response.locals.you }
      };

      return response.json({ new_package, message: 'Package Created!' });
    }
    catch(e) {
      console.log('error', e);
      return response.json({ e, error: true, message: 'Could not create package...' });
    };
  })()
}

function submit_reset_password_request(request, response) {
  (async function(){
    try {
      if(request.session.id) {
        return response.json({ error: true, message: 'password reset cannot be requested during an sctive session' });
      }

      let { email } = request.body;
      let user, reset_request;
      if(email) {
        email = email.toLowerCase().trim();
      }
      if(!email) {
        return response.json({ error: true, message: 'input is required' });
      }

      let user_result = await models.Users.findOne({ where: { email } });
      if(!user_result) { return response.json({ error: true, message: 'No account found by that email' }); }
      user = user_result.dataValues;

      let request_result = await models.ResetPasswordRequests.findOne({ where: { user_email: user.email } });
      if(request_result) { return response.json({ error: true, message: 'A password reset has already been requested for this email' }); }

      let new_reset_request = await models.ResetPasswordRequests.create({ user_email: user.email });
      reset_request = new_reset_request.dataValues;

      // send reset request email
      let host = request.get('host');
      let link = host.endsWith('/') ? (host + 'reset_password') : (host + '/reset_password');
      let email_subject = 'Epsity - Password reset requested';
      let email_html = templateEngine.PasswordReset_EMAIL({ user, reset_request, link });

      let email_result = await sendgrid_manager.send_email(null, user.email, email_subject, email_html);
      return response.json({ success: true, message: 'A password reset request has been sent to the provided email!' });
    }
    catch(e) {
      console.log(e);
      return response.json({ e, error, message: 'Could not sumbit reset password request...' });
    }
  })()
}

function toggle_delivery_request(request, response) {
  (async function(){
    try {
      const 
        package_id = parseInt(request.params.package_id), 
        user_id = parseInt(request.params.user_id);
      
      if (user_id !== response.locals.you.id) {
        return response.json({ error: true, message: 'invalid user id' });
      }

      const packageData = await models.Packages.findOne({ where: { id: package_id } });
      const owner_id = packageData.dataValues.owner_id;
      const check = await models.DeliveryRequests.findOne({ 
        where: { package_id, user_id },
        // include: [{
        //   model: models.Packages,
        //   as: 'package',
        // },
        // {
        //   model: models.Users,
        //   as: 'user',
        // }] 
      });

      let resp, eventName = `for:user-${owner_id}`;

      if (check) {
        resp = await check.destroy()
        request.io.emit(eventName, { 
          event: request.EVENT_TYPES.DELIVERY_REQUEST_CANCELED,
          message: `Delivery request canceled!`,
          deliver_request: resp,
        });
        
      } else {
        resp = await models.DeliveryRequests.create({ package_id, user_id });
        request.io.emit(eventName, {
          event: request.EVENT_TYPES.NEW_DELIVERY_REQUEST,
          message: `New delivery request!`,
          deliver_request: resp,
        });
      }
        

      return response.json({ 
        resp, 
        deliver_request: !check, 
        message: !!check ? `Request sent successfully!` : `Declined request`
      }); 
    } catch (e) {
      console.log(e);
      return response.json({ e, error, message: 'Could not process request...' });
    }
  })()
}

function add_package_tracking_update(request, response) {
  (async function(){
    const package_id = parseInt(request.params.package_id, 10);
    if (!package_id) {
      return response.json({ error: true, message: 'package id is required in the request route' });
    }
    const packageDataObj = request.body.packageData && JSON.parse(request.body.packageData) || {};

    if (!packageDataObj.id) {
      return response.json({ error: true, message: 'invalid payload: package data not loaded' });
    }
    if (packageDataObj.id !== package_id) {
      return response.json({ error: true, message: 'invalid payload: package auth failed' });
    }
    if (packageDataObj.helper_id !== response.locals.you.id) {
      return response.json({ error: true, message: 'invalid request: not authorized' });
    }

    if (!request.body.description || request.body.description.trim() < 10) {
      return response.json({ error: true, message: 'invalid payload: description must be minimum 10 characters' });
    }

    const createPackageTrackingUpdatesObj = {
      package_id,    
      message: request.body.description.trim()
    };

    const image_file = request.files && request.files.tracking_update_icon_input || null;
    if(image_file) {
      const type = image_file.mimetype.split('/')[1];
      if(!chamber.allowed_images.includes(type)) {
        return response.json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
      } else {
        const imgData = await cloudinary_manager.store(image_file, null);
        createPackageTrackingUpdatesObj.icon_id = imgData.result.public_id, 
        createPackageTrackingUpdatesObj.icon_link = imgData.result.secure_url
      }
    }

    const packageTrackingUpdateModel = await models.PackageTrackingUpdates.create(createPackageTrackingUpdatesObj);
    const packageTrackingUpdate = {
      ...packageTrackingUpdateModel.dataValues,
      helper: {
        ...response.locals.you
      }
    };

    const createNotificationObj = {
      from_id: packageDataObj.helper_id,
      to_id: packageDataObj.owner_id,
      action: chamber.EVENT_TYPES.NEW_PACKAGE_TRACKING_UPDATE,
      target_type: chamber.Notification_Target_Types.PACKAGE,
      target_id: package_id,
    };
    const notificationUpdateModel = await models.Notifications.create(createNotificationObj);

    const notification = {
      ...notificationUpdateModel.dataValues,
      from: { ...response.locals.you },
    };

    request.io.emit(`for:user-${packageDataObj.owner_id}`, {
      event: request.EVENT_TYPES.NEW_PACKAGE_TRACKING_UPDATE,
      message: `New package tracking update`,
      data: { 
        notification, 
        package: packageDataObj,
        package_tracking_update: packageTrackingUpdate,
      }
    });

    return response.json({
      package_tracking_update: packageTrackingUpdate,
      message: 'Tracking updated!' 
    });
  })()
}



/*  Exports  */

module.exports = {
  sign_up,
  sign_out,
  create_review,
  create_package,
  toggle_delivery_request,
  submit_reset_password_request,
  add_package_tracking_update,
}
