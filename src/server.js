import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb'; //allows us to connect to our local database
import path from 'path'; // path is a standard libribrary included in NodeJS, so we do not do any npm install

//creating our backend server
const app = express();

//Tell our server where to serve the static files from
app.use(express.static(path.join(__dirname, '/build')));

//add this line above the routes
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', {
      useUnifiedTopology: true,
    });

    const db = client.db('my-blog');

    await operations(db);

    client.close();
  } catch (e) {
    res.status(500).json({ message: 'Error connecting to db', e });
  }
};

//end point that gets an article from the database
app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });

    res.status(200).json(articleInfo);
  }, res);
});

//upvotes endpoint
app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    //retrieve the article that matches the article name
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });

    //actually do the update to the upvotes
    await db.collection('articles').updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );

    //retrieve the article again so we can send response to client
    const updatedArtcleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });

    res.status(200).json(updatedArtcleInfo);
  }, res);
});

//comments endpoint
app.post('/api/articles/:name/add-comment', (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });

    await db.collection('articles').updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );

    const updatedArticleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

//All requests that are not caught by the API routes should be passed onto our App. This will allow our client side to navigate between pages and process urls correctly
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

//starting up the App
app.listen(8000, () => console.log('Listening on port 8000...'));
