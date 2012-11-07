var querystring = require('querystring');
var https = require('https'), http = require('http');
var sha1 = require('sha1');
var zlib = require('zlib');
var fs = require('fs');
var url = require('url');

var api_key = 'fceaa3f5-5dc0-487e-9780-c84fc7221cd5';
var secret_key = '5ae66c24-eb6e-4d43-9806-ad5635b7b2f0';

var shop_id='427036';

var spreadshirt_host = 'api.spreadshirt.com';
var design_path = '/api/v1/shops/' + shop_id + '/designs';
var product_path = '/api/v1/shops/' + shop_id + '/products';


function createDesign() {
  var design_payload = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<design xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://api.spreadshirt.net">\n<name>Super cool design</name>\n<description>A super cool design</description>\n</design>';

  var time = Date.now();
  var options = {
        host: spreadshirt_host,
        path: design_path + '?apiKey='+ api_key + 
                            '&sig=' + sha1('POST ' + 'http://' + spreadshirt_host + design_path + " " + time + " " + secret_key) + 
                            '&time=' + time ,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Content-Length': design_payload.length
        }
      };

  var req = http.request(options, function(res) {
    // res.setEncoding('utf8');
    // console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));
    if (res.headers.location) {
      getDesignData(res.headers.location);
    } else {
      var body = '';
      if( res.headers['content-encoding'] == 'gzip' ) {
        var gzip = zlib.createGunzip();
        res.pipe(gzip);
        output = gzip;
      } else {
        output = res;
      }

      output.on('data', function (chunk) {
          body += chunk;
      });

      output.on('end', function() {
        console.log("Post done making:");
        console.log(body);
      });
    }
  }).on('error', function(e) {
    console.log('http post ERROR: ' + e.message);
    console.log(JSON.stringify(e, undefined, 2));
  });
  req.write(design_payload);
  req.end();
}

function getDesignData(url) {
  http.get(url + "?mediaType=json", function(res) {
    body = '';
    res.on('data', function (chunk) {
        body += chunk;
    });

    res.on('end', function() {
      console.log("Get done making:");
      var data = JSON.parse(body);
      console.log(data);
      var uploadUrl = data.resources[data.resources.length-1].href;
      var designId = data.id;
      console.log("uploadUrl: " + uploadUrl);
      uploadDesign(uploadUrl, designId);
    });
  })
}

function uploadDesign(uploadUrl, designId) {
  console.log("getting upload data");
  fs.readFile('./design.png', function (err,data) {
    if (err) {
      return console.log(err);
    }
    uploadImageData(data, uploadUrl, designId);
  });
}

function uploadImageData(image_payload, uploadUrl, designId) {
  console.log("upload data to " + uploadUrl);
  var uploadUrlObj = url.parse(uploadUrl);
  var time = Date.now();
  var options = {
        host: uploadUrlObj.host,
        path: uploadUrlObj.path + '?apiKey='+ api_key + 
                            '&sig=' + sha1('PUT ' + uploadUrl + " " + time + " " + secret_key) + 
                            '&time=' + time ,
        method: 'PUT',
        headers: {
            'Content-Type': 'image/png',
            'Content-Length': image_payload.length
        }
      };

  var req = http.request(options, function(res) {
    // res.setEncoding('utf8');
    console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));
    if (res.statusCode == '200') {
      console.log("uploaded design data.");
      uploadProduct(designId);
    } else {
      var body = '';
      if( res.headers['content-encoding'] == 'gzip' ) {
        var gzip = zlib.createGunzip();
        res.pipe(gzip);
        output = gzip;
      } else {
        output = res;
      }

      output.on('data', function (chunk) {
          body += chunk;
      });

      output.on('end', function() {
        console.log("Put done making:");
        console.log(body);
      });
    }
  }).on('error', function(e) {
    console.log('http post ERROR: ' + e.message);
    console.log(target_path);
    console.log(JSON.stringify(e, undefined, 2));
  });
  req.write(image_payload);
  req.end();
}

function uploadProduct(designId) {
  fs.readFile('./xml/product.xml', function (err,data) {
    if (err) {
      return console.log(err);
    }
    uploadProductData(data.toString('utf8').replace("DESIGN_ID", designId));
    // uploadImageData(data, uploadUrl, designId);
  });
}

function uploadProductData(product_payload) {
  console.log('uploading product data');
  console.log(spreadshirt_host + product_path);
  console.log(product_payload);
  var time = Date.now();
  var options = {
        host: spreadshirt_host,
        path: product_path + '?apiKey='+ api_key + 
                            '&sig=' + sha1('POST ' + 'http://' + spreadshirt_host + product_path + " " + time + " " + secret_key) + 
                            '&time=' + time ,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Content-Length': product_payload.length
        }
      };

  var req = http.request(options, function(res) {
    // res.setEncoding('utf8');
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    if (res.headers.location) {
      console.log("Location from product post:", res.headers.location)
      // getDesignData(res.headers.location);
      displayProduct(res.headers.location);
    } else {
      var body = '';
      if( res.headers['content-encoding'] == 'gzip' ) {
        var gzip = zlib.createGunzip();
        res.pipe(gzip);
        output = gzip;
      } else {
        output = res;
      }

      output.on('data', function (chunk) {
          body += chunk;
      });

      output.on('end', function() {
        console.log("Post done making:");
        console.log(body);
      });
    }
  }).on('error', function(e) {
    console.log('http post ERROR: ' + e.message);
    console.log(JSON.stringify(e, undefined, 2));
  });
  req.write(product_payload);
  req.end();
}

function displayProduct(url) {
  http.get(url + "?mediaType=json", function(res) {
    body = '';
    res.on('data', function (chunk) {
        body += chunk;
    });

    res.on('end', function() {
      console.log("Get product done making:");
      var data = JSON.parse(body);
      console.log(data);
      var uploadUrl = data.resources[data.resources.length-1].href;
      var designId = data.id;
      console.log("uploadUrl: " + uploadUrl);
      // uploadDesign(uploadUrl, designId);
    });
  })
}

createDesign();

