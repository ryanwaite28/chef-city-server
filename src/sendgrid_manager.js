const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function send_email(from, to, subject, html) {
  return new Promise((resolve, reject) => {
    const msg = { from: from || process.env.SENDGRID_USER_EMAIL, to, subject, html };
    sgMail.send(msg)
    .then(result => {
      console.log('email sent ---');
      return resolve({ result });
    })
    .catch(error => {
      console.log('email failed ---');
      console.log(error);
      return reject({ error });
    })
  });
}



module.exports = {
  sgMail,
  send_email
}
