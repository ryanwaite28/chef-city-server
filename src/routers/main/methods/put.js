'use strict';

const bcrypt = require('bcrypt-nodejs');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const models = require('../../../models').models;
const chamber = require('../../../chamber');
const templateEngine = require('../../../templateEngine');
const cloudinary_manager = require('../../../cloudinary_manager');
const sendgrid_manager = require('../../../sendgrid_manager');


/* --- PUT Functions --- */



function sign_in(request, response) {
  (async function() {
    if(request.session.id) { return response.json({ error: true, message: "Client already signed in" }) }
    let { email, password } = request.body;
    if(email) { email = email.toLowerCase(); }
    if(!email) {
      return response.json({ error: true, message: 'Email Address field is required' });
    }
    if(!password) {
      return response.json({ error: true, message: 'Password field is required' });
    }
    var check_account = await models.Users.findOne({
      where: { [Op.or]: [{email: email}, {username: email}] }
    });
    if(!check_account) {
      return response.json({ error: true, message: 'Invalid credentials.' });
    }
    if(bcrypt.compareSync(password, check_account.dataValues.password) === false) {
      return response.json({ error: true, message: 'Invalid credentials.' });
    }
    var user = check_account.dataValues;
    delete user['password'];
    request.session.id = chamber.uniqueValue();
    request.session.you = user;

    let session_token = await models.Tokens.findOne({ where: { ip_address: request.ip, user_agent: request.get('user-agent'), user_id: user.id } });
    if(session_token) {
      return response.json({ online: true, user, token: session_token.dataValues.token, message: 'Signed In!' });
    }
    else {
      let new_token = chamber.generateToken(user.id);
      models.Tokens.create({ 
        ip_address: request.ip, 
        user_agent: request.get('user-agent'), 
        user_id: user.id, 
        token: new_token, 
        device: request.device.type 
      });
      return response.json({ online: true, user, token: new_token, message: 'Signed In!' });
    }
  })()
}

function sign_out(request, response) {
  request.session.reset();
  return response.json({ online: false, successful: true });
}


/*  Account Handlers  */

function change_user_password(request, response) {
  let { old_password, new_password, new_password_verify } = request.body;
  if(!old_password) {
    return response.json({ error: true, message: 'Old Password field is required' });
  }
  if(!new_password) {
    return response.json({ error: true, message: 'New Password field is required' });
  }
  if(!new_password_verify) {
    return response.json({ error: true, message: 'New Password Confirmation field is required' });
  }
  if(!chamber.validatePassword(new_password)) {
    return response.json({
      error: true,
      message: 'New Password must be: at least 7 characters, upper and/or lower case alphanumeric'
    });
  }
  if(new_password !== new_password_verify) {
    return response.json({ error: true, message: 'New Passwords must match' });
  }
  models.Users.findOne({ where: { id: response.locals.you.id } })
  .then(account => {
    if(bcrypt.compareSync(old_password, account.dataValues.password) === false) {
      return response.json({
        error: true,
        message: 'Old Password is incorrect'
      });
    }
    models.Users.update({ password: bcrypt.hashSync(new_password) }, { where: { id: response.locals.you.id } })
    .then(resp => {
      return response.json({
        message: 'Password updated successfully!'
      });
    })
    .catch(err => {
      console.log('err', err);
      return response.json({ error: true, message: 'could not upload...' });
    });
  })
  .catch(err => {
    console.log('err', err);
    return response.json({ error: true, message: 'could not upload...' });
  });
}

function update_icon(request, response) {
  let icon_file = request.files && request.files.icon_file || null;
  if(!icon_file) {
    return response.json({ error: true, message: 'No file was uploaded...' });
  }
  let allowed = ['jpeg', 'jpg', 'png'];
  let type = icon_file.mimetype.split('/')[1];
  if(!allowed.includes(type)) {
    return response.json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
  }

  cloudinary_manager.store(icon_file, response.locals.you.icon_id)
  .then(obj => {
    let cloudinary_image_id = obj.result.public_id;
    let cloudinary_image_link = obj.result.secure_url;
    models.Users.update({ icon_id: cloudinary_image_id, icon_link: cloudinary_image_link }, { where: { id: response.locals.you.id } })
    .then(res => {
      response.locals.you.icon_id = cloudinary_image_id;
      response.locals.you.icon_link = cloudinary_image_link;
      return response.json({ user: response.locals.you, message: 'Icon Updated!' });
    })
    .catch(e => {
      console.log(e);
      return response.json({ error: true, message: 'Could not update...' });
    })
  })
  .catch(e => {
    console.log(e);
    return response.json({ error: true, message: 'Could not upload...' });
  })
}

function update_info(request, response) {
  (async function(){
    let { displayname, username, location, link, bio, phone } = request.body;
    if(username) { username = username.toLowerCase(); }

    if(!displayname) {
      return response.json({ error: true, message: 'Display Name field is required' });
    }
    if(!username) {
      return response.json({ error: true, message: 'Username field is required' });
    }
    if(!chamber.validateDisplayName(displayname)) {
      return response.json({ error: true, message: 'Display name must be letters only, 2-50 characters long. Spaces, dashes and apostrophes are allowed' });
    }
    if(!chamber.validateUsername(username)) {
      return response.json({ error: true, message: 'Username must be letters and numbers only, 2-50 characters long. Dashes and underscores are allowed' });
    }
    if(bio) {
      bio = bio.trim();
      if(bio.length > 250) {
        return response.json({ error: true, message: 'Bio field is too long' });
      }
    }
    else {
      bio = '';
    }

    if(username === response.locals.you.username) {
      models.Users.update({ displayname, location, link, bio, phone }, { where: { id: response.locals.you.id } })
      .then(resp => {
        response.locals.you.displayname = displayname;
        response.locals.you.link = link;
        response.locals.you.location = location;
        response.locals.you.bio = bio;
        response.locals.you.phone = phone;
        return response.json({ user: response.locals.you, message: 'Info Updated!' });
      })
      .catch(e => {
        console.log(e);
        return response.json({ error: e || true, message: 'Error updating info...' });
      })
    }
    else {
      var check_username = await models.Users.findOne({ where: { username } });
      if(check_username) {
        return response.json({ error: true, message: 'Username already in use' });
      }
      models.Users.update({ displayname, username, location, link, bio, phone }, { where: { id: response.locals.you.id } })
      .then(resp => {
        response.locals.you.displayname = displayname;
        response.locals.you.username = username;
        response.locals.you.link = link;
        response.locals.you.location = location;
        response.locals.you.bio = bio;
        response.locals.you.phone = phone;
        return response.json({ user: response.locals.you, message: 'Info Updated!' });
      })
      .catch(e => {
        console.log(e);
        return response.json({ error: e || true, message: 'Error updating info...' });
      })
    }
  })()
}

function update_email(request, response) {
  (async function(){
    let { email, password } = request.body;
    if(email) { email = email.toLowerCase(); }
    if(!email) {
      return response.json({ error: true, message: 'Email Address field is required' });
    }
    if(!chamber.validateEmail(email)) {
      return response.json({ error: true, message: 'Email is invalid. Check Format.' });
    }
    var check_email = await models.Users.findOne({ where: { email } });
    if(check_email) {
      return response.json({ error: true, message: 'Email already in use' });
    }
    models.Users.update({ email }, { where: { id: response.locals.you.id } })
    .then(resp => {
      response.locals.you.email = email;
      return response.json({ user: response.locals.you, message: 'Email Updated!' });
    })
    .catch(e => {
      console.log(e);
      return response.json({ error: e || true, message: 'Error updating info...' });
    })
  })()
}

function update_paypal_email(request, response) {
  (async function(){
    let { paypal, password } = request.body;
    if(paypal) { paypal = paypal.toLowerCase(); }
    if(!paypal) {
      return response.json({ error: true, message: 'Paypal Email Address field is required' });
    }
    if(!chamber.validateEmail(paypal)) {
      return response.json({ error: true, message: 'Paypal Email is invalid. Check Format.' });
    }
    var check_email = await models.Users.findOne({ where: { paypal } });
    if(check_email) {
      return response.json({ error: true, message: 'Paypal Email already in use' });
    }
    models.Users.update({ paypal }, { where: { id: response.locals.you.id } })
    .then(resp => {
      response.locals.you.paypal = paypal;
      return response.json({ user: response.locals.you, message: 'Paypal Email Updated!' });
    })
    .catch(e => {
      console.log(e);
      return response.json({ error: e || true, message: 'Error updating info...' });
    })
  })()
}

function update_package(request, response) {
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
        helper_id, 
        fulfilled,
        image_id
      } = JSON.parse(request.body.json_data);
      if(helper_id && !fulfilled) {
        return response.json({ error: true, message: 'cannot update a package that is currently being delivered' });
      }
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
      let allowed = ['jpeg', 'jpg', 'png'];
      if(image_file) {
        let type = image_file.mimetype.split('/')[1];
        if(!allowed.includes(type)) {
          return response.json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
        } else {
          let imgData = await cloudinary_manager.store(image_file, image_id);
          dataObj.image_id = imgData.result.public_id, 
          dataObj.image_link = imgData.result.secure_url
        }
      }

      const package_update = await models.Recipes.update(dataObj, { 
        where: { 
          id: request.params.package_id, 
          creator_id: response.locals.you.id 
        } 
      });

      const package_model = await models.Recipes.findOne({ where: { id: request.params.package_id } });
      const packageData = {
        ...package_model.dataValues,
        creator: { ...response.locals.you }
      };
      return response.json({ package: packageData, message: 'Package Updated!' });
    }
    catch(e) {
      console.log('error', e);
      return response.json({ e, error: true, message: 'Could not update package...' });
    };
  })()
}

function submit_password_reset_code(request, response) {
  (async function(){
    try {
      if(request.session.id) {
        return response.json({ error: true, message: 'password reset cannot be requested during an sctive session' });
      }

      let { code } = request.body;
      let user, reset_request;
      if(!code) {
        return response.json({ error: true, message: 'reset code is required' });
      }

      let request_result = await models.ResetPasswordRequests.findOne({ where: { unique_value: code } });
      if(!request_result) { return response.json({ error: true, message: 'Invalid code, no reset request found by that value' }); }
      reset_request = request_result.dataValues;

      let user_result = await models.Users.findOne({ where: { email: reset_request.user_email } });
      if(!user_result) {
        return response.json({ error: true, message: 'error loading user from reset request...' });
      }
      user = user_result.dataValues;
      let password = chamber.uniqueValue();
      let hash = bcrypt.hashSync(password);
      let update_result = await models.Users.update({ password: hash }, { where: { id: user.id } });
      let delete_result = await models.ResetPasswordRequests.destroy({ where: { id: reset_request.id } });

      // send new password email
      let host = request.get('host');
      let link = host.endsWith('/') ? (host + 'signin') : (host + '/signin');
      let email_subject = 'Epsity - Password reset successful!';
      let email_html = templateEngine.PasswordResetSuccess_EMAIL({ user, password, link });

      let email_result = await sendgrid_manager.send_email(null, user.email, email_subject, email_html);

      return response.json({ success: true, message: 'The Password has been reset!' });
    }
    catch(e) {
      console.log(e);
      return response.json({ e, error: true, message: 'Could not reset password...' });
    }
  })()
}

function accept_package_delivery_request(request, response) {
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

    const package_id = delivery_request.dataValues.package_id;
    const packageData = await models.Recipes.findOne({ where: { id: package_id }});
    if (!packageData) {
      return response.json({ error: true, message: 'package not found' });
    }
    if (packageData.dataValues.owner_id !== response.locals.you.id) {
      return response.json({ error: true, message: 'user does not own this package' });
    }
    if (packageData.dataValues.helper_id) {
      return response.json({ error: true, message: 'someone is already delivering this package' });
    }

    await models.Recipes.update(
      { helper_id: delivery_request.dataValues.user_id },
      { where: { id: packageData.id, owner_id: response.locals.you.id }}
    );
    await models.DeliveryRequests.destroy({ where: { id: package_delivery_request_id }});

    const packageObj = await models.Recipes.findOne({ 
      where: { id: package_id },
      include: [{
        model: models.Users,
        as: 'owner',
        attributes: { exclude: ['password'] }
      }, {
        model: models.Users,
        as: 'helper',
        attributes: { exclude: ['password'] }
      }]
    });

    request.io.emit(`for:user-${delivery_request.dataValues.user_id}`, { 
      message: `Delivery request accepted!`,
       packageData: packageObj
    });

    return response.json({ package: packageObj.dataValues, message: 'Request accepted successfully!' });
  })()
}

function package_mark_as_delivered(request, response) {
  (async function(){
    const package_id = parseInt(request.params.package_id, 10);
    if (!package_id) {
      return response.json({ error: true, message: 'package id is required in the request route' });
    }
    const packageDataObj = request.body.packageData && JSON.parse(request.body.packageData) || {};

    console.log({ package_id, packageDataObj });

    if (!packageDataObj.id) {
      return response.json({ error: true, message: 'invalid payload: package data not loaded' });
    }
    if (packageDataObj.id !== package_id) {
      return response.json({ error: true, message: 'invalid payload: package auth failed' });
    }
    if (packageDataObj.helper_id !== response.locals.you.id) {
      return response.json({ error: true, message: 'invalid request: not authorized' });
    }

    await models.Recipes.update({ fulfilled: true }, { where: { id: package_id } });

    const packageTrackingUpdateModel = await models.PackageTrackingUpdates.create({
      package_id,
      message: 'Delivered!'
    });
    const packageTrackingUpdate = {
      ...packageTrackingUpdateModel.dataValues,
      helper: {
        ...response.locals.you
      }
    };

    const notificationUpdateModel = await models.Notifications.create({
      from_id: packageDataObj.helper_id,
      to_id: packageDataObj.owner_id,
      action: chamber.EVENT_TYPES.PACKAGE_MARKED_DELIVERED,
      target_type: chamber.Notification_Target_Types.PACKAGE,
      target_id: package_id,
    });
    const notification = {
      ...notificationUpdateModel.dataValues,
      from: { ...response.locals.you },
    };

    request.io.emit(`for:user-${packageDataObj.owner_id}`, {
      event: request.EVENT_TYPES.PACKAGE_MARKED_DELIVERED,
      data: { notification, package: packageDataObj }
    });
    
    return response.json({
      message: 'Marked as delivered successfully!',
      package_tracking_update: packageTrackingUpdate,
    });
  })()
}




/* --- Exports --- */

module.exports = {
  sign_out,
  sign_in,
  change_user_password,
  update_icon,
  update_info,
  update_email,
  update_paypal_email,
  update_package,
  submit_password_reset_code,
  accept_package_delivery_request,
  package_mark_as_delivered,
}
