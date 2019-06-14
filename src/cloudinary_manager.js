const cloudinary = require('cloudinary');
const chamber = require('./chamber');
const fs = require('fs');

function upload_file(file) {
  return new Promise((resolve, reject) => {
    let unique_filename = chamber.uniqueValue();
    let filename = unique_filename + file.name;
    let image_path = __dirname + '/' + filename;
    file.mv(filename, function(error) {
      if (error) {
        return reject({error: true, message: "could not upload file..."});
      }
      else {
        return resolve({ filename, image_path });
      }
    });
  });
}

function store(file, public_id) {
  return new Promise((resolve, reject) => {
    upload_file(file)
    .then(filedata => {
      const configObject = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      };
      
      cloudinary.config(configObject);

      if(public_id) {
        cloudinary.v2.uploader.destroy(public_id, function(error, result) {
          if(error) { console.log(error); }
          console.log(
            'deleted from cloudinary successfully!', 
            'public_id: ' + public_id, 
            'result: ', result
          );
        });
      }
      cloudinary.uploader.upload(filedata.filename, function(result) {
        fs.unlink(filedata.filename, (err) => {
          if(err) { console.log(err); }
          console.log(
            'file deleted successfully!', 
            filedata.filename
          );
        });
        return result && result.secure_url ?
        resolve({ result, filedata }) : 
        reject({ error: result });
      })
    })
    .catch({ error: true });
  });
}

module.exports = {
  cloudinary,
  upload_file,
  store
}
