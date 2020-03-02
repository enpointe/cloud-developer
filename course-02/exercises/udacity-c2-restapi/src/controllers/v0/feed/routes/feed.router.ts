import { Router, Request, Response } from 'express';
import { FeedItem } from '../models/FeedItem';
import { config } from '../../../../config/config';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';

const router: Router = Router();

// Get all feed items
router.get('/', async (req: Request, res: Response) => {
    const items = await FeedItem.findAndCountAll({order: [['id', 'DESC']]});
    items.rows.map((item) => {
            if(item.url) {
                item.url = AWS.getGetSignedUrl(item.url);
            }
    });
    res.send(items);
});

//Add an endpoint to GET a specific resource by Primary Key
router.get('/:id', 
    async (req: Request, res: Response) => {
        let { id } = req.params;
        const record = await FeedItem.findByPk(id);
        if ( record ) {
            res.status(200).send(record);
        } else {
            res.status(400).send("not found");
        }
});

// Get the image associated with a feed item
router.get('/fetchimage/:id', 
    //requireAuth, 
    async (req: Request, res: Response) => {
        let id = req.params.id;
        const record = await FeedItem.findByPk(id);
        if ( !record ) {
            res.status(400).send("not found");
            return;
        }
        let url = AWS.getGetSignedUrl(record.url);
        if ( !url ) {
            res.status(400).send("File " + record.url + " not found.");
            return;
        }
        const encoded = encodeURIComponent(url);
        const rURL = config.imageHandler.domain + config.imageHandler.path + '?image_url='+encoded;
        console.log("Redirecting to " + rURL);
        res.redirect(rURL);
});

// update a specific resource
// only the caption or url may be modified
router.patch('/:id', 
    requireAuth, 
    async (req: Request, res: Response) => {
        let { id } = req.params;
        const record = await FeedItem.findByPk(id);
        if ( !record ) {
            res.status(400).send("not found");
            return;
        }
        const caption = req.body.caption;
        const fileName = req.body.url;
        if (caption) {
            record.caption = caption
        }
    
        // check Filename is valid
        if (fileName) {
            record.url = fileName
        }
        // Update the record 
        record.save().then(function() {
            res.status(200).send(record);
        });
});


// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName', 
    requireAuth, 
    async (req: Request, res: Response) => {
    let { fileName } = req.params;
    const url = AWS.getPutSignedUrl(fileName);
    res.status(201).send({url: url});
});

// Post meta data and the filename after a file is uploaded 
// NOTE the file name is they key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', 
    requireAuth, 
    async (req: Request, res: Response) => {
    const caption = req.body.caption;
    const fileName = req.body.url;

    // check Caption is valid
    if (!caption) {
        return res.status(400).send({ message: 'Caption is required or malformed' });
    }

    // check Filename is valid
    if (!fileName) {
        return res.status(400).send({ message: 'File url is required' });
    }

    const item = await new FeedItem({
            caption: caption,
            url: fileName
    });

    const saved_item = await item.save();

    saved_item.url = AWS.getGetSignedUrl(saved_item.url);
    res.status(201).send(saved_item);
});

export const FeedRouter: Router = router;