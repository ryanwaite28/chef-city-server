'use strict';

const nunjucks = require('nunjucks');

function installExpressApp(app) {
  nunjucks.configure( __dirname + '/html/' , {
    autoescape: true,
    express: app
  });
}

/* --- DOM --- */

function UserCardMini_DOM(user) {
  return nunjucks.render('templates/UserCardMini.html', { user });
}

/* --- Emails --- */

function SignedUp_EMAIL(data) {
  return nunjucks.render('templates/emails/SignedUp.html', { data });
}

function ContactUser_EMAIL(data) {
  return nunjucks.render('templates/emails/ContactUser.html', { data });
}

function PasswordReset_EMAIL(data) {
  return nunjucks.render('templates/emails/PasswordReset.html', { data });
}

function PasswordResetSuccess_EMAIL(data) {
  return nunjucks.render('templates/emails/PasswordResetSuccess.html', { data });
}

function NewReview_EMAIL(data) {
  return nunjucks.render('templates/emails/NewReview.html', { data });
}

/* --- Exports --- */

module.exports = {
  installExpressApp,
  UserCardMini_DOM,
  SignedUp_EMAIL,
  ContactUser_EMAIL,
  PasswordReset_EMAIL,
  PasswordResetSuccess_EMAIL,
  NewReview_EMAIL
}
