const fse = require('fs-extra');

const reactBuildDir = './react/build';
const srcBuildDir = './src/build';

const moveBuild = function() {
  console.log('moving the react/build/ directory...');
  fse.move(reactBuildDir, srcBuildDir).then(() => {
    console.log('successfully moved the react/build/ directory!');
  }).catch((error) => {
    console.log('error: ', error);
  });
}

fse.pathExists(srcBuildDir).then(exists => {
  if (exists) {
    console.log('previous build exists. deleting...');
    fse.remove(srcBuildDir).then(() => {
      console.log('successfully deleted!');
      moveBuild();
    }).catch(err => {
      console.error(err);
    })
  } else {
    console.log('previous build does not exist.');
    moveBuild();
  }
})

