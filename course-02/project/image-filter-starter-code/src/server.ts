import express from 'express';
import bodyParser from 'body-parser';
import { filterImageFromURL, deleteLocalFiles } from './util/util';
var toJSON = require( 'utils-error-to-json' );

async function imageExists(url: string) {
  return new Promise(function(resolve, reject) {
    // Standard XHR to load an image
    var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.timeout = 1000 * 20; // time in milliseconds (20 seconds)
    xhr.open('GET', url);

    // When the request loads, check whether it was successful
    xhr.onload = function() {
      if (xhr.status === 200) {
        // If successful, resolve the promise by passing back the request response
        resolve(xhr.response);
      } else {
        // If it fails, reject the promise with a error message
        let msg = 'Problem accessing image ' + url;
        if (xhr.statusText) {
          msg = msg + '; ' + xhr.statusText;
        } else {
          msg = msg + '; error code:' + xhr.status;
        }
        reject(new Error(msg));
      }
    };
    xhr.onerror = function() {
      reject(new Error('Network error ' + url));
    };

    // Send the request
    xhr.send(null);
  });
}

(async () => {
  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // process.on('unhandledRejection', (reason, promise) => {
  //   console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  //   // Application specific logging, throwing an error, or other logic here
  // });

  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]
  app.get('/filteredimage/',  async (req, res) => {
    let url: string = req.query.image_url;
    if (!url) {
      res.status(400).send('missing required parameter: image_url');
      return;
    }
    process.on('unhandledRejection', error => {
      console.log(toJSON(error));
      return;
    });
    
    try {
      await imageExists(url);
    } catch (error) {
      console.log(toJSON(error));
      res.status(404).send(error.toString());
      return;
    }
    let fileName: string;
    try {
      fileName = await filterImageFromURL(url);
    } catch (error) {
      console.log(toJSON(error));
      res.status(422).send("Could not projecss image " + url + " Reason: " + error.toString());
      return;
    }
    var options = {
      url: url,
      dotfiles: 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      }
    }
    res.sendFile(fileName, options, function (error) {
      if (error) {
        console.log(toJSON(error));
      } else {
        try {
          deleteLocalFiles([fileName]);
        } catch(e) {
          console.log("error removing ", fileName);
          console.log(toJSON(error));
        }
      }
    });
  });

  // Root Endpoint
  // Displays a simple message to the user
  app.get('/', async (req, res) => {
    res.send('try GET /filteredimage?image_url={{}}');
  });

  // Start the Server
  app.listen(port, () => {
    // Create a tmp directory in the server directory

    const fs = require('fs');
    const dir = './tmp';

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();
