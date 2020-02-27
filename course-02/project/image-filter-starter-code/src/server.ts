import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
  });

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
  app.get( "/filteredimage/", 
    async ( req, res ) => {

      let url: string = req.query.image_url;
      if ( !url ) {
        res.status(400).send("missing required parameter: url_image")
        return
      }
      console.log("URL ", url)
      var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
      let request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onreadystatechange = function(){
        if (request.readyState === 4){
            if (request.status === 404) {  
                res.status(404).send(url + " does not exist!");
                return
            }  
        }
      };
      request.abort();  // Got what we need, abort
      let fileName;
      try {
        fileName = await filterImageFromURL(url);
        var options = {
          url: url,
          dotfiles: 'deny',
          headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
          }
        }
        res.sendFile(fileName, options);
      } catch (err) {
        console.log("ERROR: ", err)
      }
      
      // Clean up
      if ( !fileName ) {
        await deleteLocalFiles([ fileName ])
      }
  } );
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      // Create a tmp directory in the server directory


      const fs = require('fs');
      const dir = './tmp';

      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }

      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();