var spawn = require('child_process').spawn;
var args = require('minimist')(process.argv.slice(2));

if (!args.config) {
  console.log('Missing --config');
  return;
}

function log(msg) {
  process.stdout.write(msg);
}

function capture(config) {
  var pc = spawn('phantomjs', ['capture.js', config]);
  pc.stdout.on('data', log);
  pc.stderr.on('data', log);

  pc.on('close', function() {
    diff(config);
  });
}

function diff(config) {
  var pc = spawn('node', ['diff.js', config]);
  pc.stdout.on('data', log);
  pc.stderr.on('data', log);
}

capture(args.config);