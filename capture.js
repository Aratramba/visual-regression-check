#!/usr/bin/phantomjs --ignore-ssl-errors=yes
var args = require('system').args;
var fs = require('fs');

var constants = require('./constants');


/**
 * Init
 */

function init() {
  console.log('');

  // check argument
  if (!args[1]) {
    console.log('Error: Missing config file argument `phantomjs capture.js config/file.json`');
    phantom.exit();
  }

  var configFile = args[1];

  // check config file
  if (!fs.isFile(configFile)) {
    console.log('Error: File ' + configFile +' does not exist');
    phantom.exit();
  }

  // read config file
  var config = JSON.parse(fs.read(configFile));

  // set default width
  if (!config.widths) {
    config.widths = [constants.DEFAULT_WIDTH];
  }

  // remove and recreate project dir
  fs.makeDirectory('tmp/');
  fs.removeTree(['tmp', config.project].join('/'));

  // create baseline/comparison/diff dirs
  fs.makeDirectory(['tmp', config.project].join('/'));
  fs.makeDirectory(['tmp', config.project, constants.BASELINE].join('/'));
  fs.makeDirectory(['tmp', config.project, constants.COMPARISON].join('/'));

  console.log('Starting screenshots for project ' + config.project);
  console.log('This will take a while.');
  console.log('---');

  // create phantom page
  var page = require('webpage').create();

  // capture errors
  page.onError = onError;

  page.onResourceError = function(resourceError) {
    // console.log('- (resource error) ' + resourceError.url + ': ' + resourceError.errorString);
  };

  page.onConsoleMessage = function(msg) {
    // console.log('- (browser console): ' + msg);
  };

  page.onResourceRequested = function (request) {
    // console.log('Request ' + JSON.stringify(request, undefined, 4));
  };


  page.viewportSize = {
    width: constants.DEFAULT_WIDTH,
    height: 800
  };

  next(page, config, 0);
}

init();


/**
 * Log errors
 */

function onError(msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
}

phantom.onError = onError;


/**
 * Check for login
 */

function checkLogin(title) {
  if (title.toLowerCase().indexOf('log in') > -1) {
    return true;
  }
  return false;
}


/**
 * Take screenshot
 */

function screenshot(page, config, i, type) {

  if (config.pages[i].timeout) {
    console.log('- Wait: ' + config.pages[i].timeout + 'ms');
  }

  // wait a couple of seconds
  setTimeout(function() {

    for (var ii = 0, l = config.widths.length; ii < l; ++ii) {
      
      var filename = ['tmp', config.project, type, config.pages[i].name].join('/') + '-' + config.widths[ii] + 'w.png';

      page.evaluate(function(width) {
        document.getElementsByTagName("html")[0].style.overflow = "hidden";
        document.getElementsByTagName("html")[0].style.width = width + "px";
        document.getElementsByTagName("html")[0].style.maxWidth = width + "px";
      }, config.widths[ii]);

      page.viewportSize = {
        width: config.widths[ii],
        height: 800
      };

      page.render(filename , {format: 'png'});
      console.log('- Created screenshot: ' + config.pages[i].name + ': ' + config.widths[ii] + 'w');
    }
    
    console.log('');

    // next
    if (type === constants.BASELINE) {
      open(page, config, i, constants.COMPARISON);
    } else if (type === constants.COMPARISON) {
      next(page, config, i + 1);
    }
  }, (+config.pages[i].timeout || 1000));
}


/**
 * Open page
 */

function open(page, config, i, type) {
  var url = config.pages[i].path;

  console.log('Opening: '+ config[type] + url);

  page.open(config[type] + url, function(status) {
    setTimeout(function() {
      if (status === "success") {
        console.log('- Opened ' + type + ': ' + config.pages[i].path);

        // get page title
        var title = page.evaluate(function() {
          return document.title;
        });

        // set body background
        page.evaluate(function() {
          document.body.bgColor = 'white';
        });

        // check if login is required
        if (checkLogin(title)) {
          console.log('- Login required: ' + url);

          // wait for page to load
          page.onLoadFinished = function() {
            console.log('- Completed login form');
            page.onLoadFinished = null;
            screenshot(page, config, i, type);
          };

          // fill and submit login form
          page.evaluate(function(url, username, password) {
            console.log('Filling login form: ' + url);
            document.forms[0].username.value = username;
            document.forms[0].password.value = password;
            document.forms[0].submit();
          }, url, config.username, config.password);

        } else {
          if(config.pages[i].customScript) {
            page.evaluateJavaScript(config.pages[i].customScript);
          }
          screenshot(page, config, i, type);
        }
      } else {
        console.log('- Failed to open ' + type + ': ' + config.pages[i].path);
        console.log('- ' + status);
      }
    }, 0);
  });
}


/**
 * Grab next page
 */

function next(page, config, i) {
  if (i === config.pages.length) {
    console.log('Done, exiting.');
    phantom.exit();
    return;
  }

  open(page, config, i, constants.BASELINE);
}