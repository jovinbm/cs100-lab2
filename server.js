const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
require('cross-fetch/polyfill');

const app = express();
const host = '127.0.0.1';
const port = 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const API_KEY = '81745fd0-b77e-11e8-a4d1-69890776a30b';

//create a javascript object to store the comments for each object.
let objects_comments = {};

// behavior for the index route
app.get('/',async  (req, res) => {
  const url = `https://api.harvardartmuseums.org/gallery?size=100&apikey=${API_KEY}`;
  try {
    const response = await fetch(url);
    if(!response.ok){
      throw new Error(`Response from api not ok: ${response.status}`);
    }
    const data = await response.json();
    res.render('index', {galleries: data.records});
  }
  catch(error){
    console.error(error);
      res.json({
        error: error.message
      })
  }
});

app.get('/gallery/:gallery_id', async (req, res) => {
  const url = `https://api.harvardartmuseums.org/object?apikey=${API_KEY}&gallery=${req.params.gallery_id}`;
  try {
    const response = await fetch(url);
    if(!response.ok){
      throw new Error(`Response from api not ok: ${response.status}`);
    }
    const data = await response.json();
    let gallery_json_objects = [];
    data.records.forEach(object => {
      let image;
      if (object.primaryimageurl == null){
        image = "No image"
      }else{
        image  = `<img src=${object.primaryimageurl}?height=150&width=150>`
      }
      people_arr = " ";
      object.people.forEach(person_info => {
        if(people_arr == " "){
          people_arr += person_info.name;
        }else{
          people_arr += ", " + person_info.name;
        }
      })
      let object_info = {id: object.id, title: object.title, page_url: object.url, image:image, people:people_arr};
      gallery_json_objects.push(object_info);
    })
    res.render('gallery', {gallery_objects: gallery_json_objects});
  }
  catch(error){
    console.error(error);
      res.json({
        error: error.message
      })
  }
});

const renderObjectPage = async (object_id, req, res) => {
  const url = `https://api.harvardartmuseums.org/object/${object_id}?apikey=${API_KEY}`;
  try {
    const response = await fetch(url);
    if(!response.ok){
      throw new Error(`Response from api not ok: ${response.status}`);
    }
    const data = await response.json();
    if (data.primaryimageurl == null){
      data.primaryimageurl = "No image"
    }else{
      data.primaryimageurl = `<img src="${data.primaryimageurl}?height=500&width=500">`
    }
    res.render('object', {object: data, obj_comments : objects_comments[req.params.object_id] || []});
  }
  catch(error){
    console.error(error);
    res.json({
      error: error.message
    })
  }
}

app.get('/object/:object_id', async (req, res) => {
  return renderObjectPage(req.params.object_id, req, res);
});


app.post('/object/:object_id', async (req, res) => {
  let {comment} = req.body;
  let obj_id = req.params.object_id;
  addObjectComments(obj_id, comment)
  return renderObjectPage(req.params.object_id, req, res);
});

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}/`);
});



// function getGalleryObjects(url){
//   console.log('yes');
//   fetch(url)
//   .then(response => response.json())
//   .then(data => {
//     console.log(`function${data}`);
//     return data;
//   })
// }


// check object storing comments if it contains object_id
// if object not present, add {object_id: []} to comments object
function addObjectComments(object_id, comment) {
  if (!(object_id in objects_comments)){
    objects_comments[object_id] = []
  }
  objects_comments[object_id].push(comment);
}