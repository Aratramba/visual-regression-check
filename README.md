# Visual Regression Manager

## Install
First install [phantomjs](http://phantomjs.org/download.html). Tested with Node version v6.9.1 and and Phantomjs v2.1.1.

```bash
node index.js --config config/wikipedia.json
```

or 

```bash
phantomjs capture.js config/wikipedia.json; node diff.js config/wikipedia.json
```

-

## Config
Create config.json

```json
{
  "project": "myproject.com",
  "baseline": "http://www.example.com",
  "comparison": "http://test.example.com",
  "pages": [
    { "name": "homepage", "path": "/" },
    { "name": "about", "path": "/about" },
  ]
}
```

```json
{
  "project": "myproject.com",
  "username": "username",
  "password": "password",
  "baseline": "https://www.example.com",
  "comparison": "https://test.example.com",
  "widths": [360, 768, 1300],
  "pages": [
    { 
        "name": "homepage", 
        "path": "/", 
        "timeout": 0,
        "customScript": "function() { console.log('hello from custom script'); }" 
    },{ 
        "name": "login", 
        "path": "/login"
    }
  ]
}
```

-

## Config
| key             | type               | description             |
|-----------------|--------------------|-------------------------|
| project            | string          | project name            |
| baseline        | string             | url to be used as baseline (https://example.com) |
| comparison      | string             | url to be used as comparison (https://test.example.com) |
| pages           | array              | array of objects for each page |
| -name          | string             | name of the page, used as filename |
| -path          | string             | path where the webpage is to be found |
| -timeout       | integer (optional) | ms to wait before taking the screenshot after page is loaded (default 1000ms)|
| -customScript  | string (optional)  | Javascript to be inserted in the webpage, see [evaluateJavaScript](http://phantomjs.org/api/webpage/method/evaluate-java-script.html) |
| widths          | array (optional)   | array of viewport widths |
| username        | string (optional)  | see login |
| password        | string (optional)  | see login |

-

## Login
A login is attempted when the page title contains the exact words "log in". The scripts looks for the first form on the page and enters the username/password config values into fields with the exact names "username" and "password".
