var fs = require('fs');
var rimraf = require('rimraf');
var BlinkDiff = require('blink-diff');

var constants = require('./constants');


/**
 * Init
 */

function init() {
  console.log('');

  var configFile = process.argv.slice(2)[0];

  if (!configFile) {
    console.log('Error: Missing config file argument `node diff.js config/file.json`');
    return;
  }

  var config = require(['./', configFile].join('/'));

  // check directory
  try {
    fs.lstatSync(['./tmp/', config.project].join('/'));
  } catch (e) {
    console.log('Error: Folder tmp/' + config.project + ' does not exist');
    return;
  }

  // set default width
  if (!config.widths) {
    config.widths = [constants.DEFAULT_WIDTH];
  }

  var projectPath = ['tmp', config.project, constants.DIFF].join('/');

  rimraf(projectPath, function() {
    fs.mkdir(projectPath, function() {
      console.log('Starting compare');
      console.log('');
      diffNext(config, 0);
    });
  });
}

init();


/**
 * Compare next
 */

function diffNext(config, i) {
  if (i === config.pages.length) {
    console.log('---');
    console.log('');

    var files = fs.readdirSync(['tmp', config.project, constants.DIFF].join('/'));
    if (files.length === 0) {
      console.log('No visual changes found.');
    } else {
      console.log(files.length + ' visual changes found.');
      files.forEach(function(file) {
        console.log('- ' + file);
      });
    }
    return;
  }

  diff(config, i, 0);
}


/**
 * Compare images
 */

function diff(config, i, ii) {
  var filename = ['tmp', config.project, '%type%', config.pages[i].name].join('/') + '-' + config.widths[ii] + 'w.png';
  var actual = filename.replace('%type%', constants.BASELINE);
  var expected = filename.replace('%type%', constants.COMPARISON);
  var output = filename.replace('%type%', constants.DIFF);

  console.log('Comparing: ' + config.pages[i].name + ': ' + config.widths[ii] + 'w');
  console.log('- ' + actual);
  console.log('- ' + expected);
  console.log('- ' + output);
  
  var diffRunner = new BlinkDiff({
    imageAPath: actual,
    imageBPath: expected,
    thresholdType: BlinkDiff.THRESHOLD_PERCENT,
    threshold: 0.001, // 0.1% threshold
    imageOutputPath: output,
    composeLeftToRight: true,
    imageOutputLimit: BlinkDiff.OUTPUT_DIFFERENT,
    outputBackgroundOpacity: .1,
    hideShift: true
  });

  diffRunner.run(function (error, result) {
    if (error) {
      console.log('- ' + error);
    } else {
      console.log('- Found ' + result.differences + ' differences.');
    }

    console.log('');

    if (ii === config.widths.length - 1) {
      diffNext(config, i + 1);
    } else {
      diff(config, i, ii + 1);
    }
  });
}