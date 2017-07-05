const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    //where file will be stored
    storage: multer.memoryStorage(),
    //what types of files are allowed
    fileFilter: function (req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            //no massage is null and is OK then pass true
            next(null, true);
        } else {
            next({message: 'That filetype isn\'t allowed!'}, false)
        }
    }
};


exports.homePage = (req, res) => {
    res.render('index')
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add store'});
};

//upload image function
exports.upload = multer(multerOptions).single('photo');

//resize image function
exports.resize = async (req, res, next) => {
    //Check if there is no new file to resize
    if (!req.file) {
        next(); //Skip to the next middleware
        return; //stop function running from any further
    }
    //here we getting file name .jpeg
    const extension = req.file.mimetype.split('/')[1];
    //namings photo for database
    req.body.photo = `${uuid.v4()}.${extension}`;
    //now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    //once we done written photo to our filesystem, keep going
    next();
};


exports.createStore = async (req, res) => {
    //it will assign id to author field with currently logged user _id
    req.body.author = req.user._id;

    const store = await (new Store(req.body)).save();

    req.flash('success', `Successfully Created ${store.name}.
             Care to leave a review ?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    // 1. Query the database for a list of all stores
    const stores = await Store.find();
    res.render('stores', {
        title: 'Stores',
        stores
    })
};

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit');
    }
};


exports.editStore = async (req, res) => {
    // 1.Find the store given the ID
    const store = await Store.findOne({_id: req.params.id});
    // 2. confirm they are the of the store
    confirmOwner(store, req.user);
    console.log(req.user);
    // 3. render out the edit form so the user can update their store
    res.render('editStore', {
        title: `Edit ${store.name}`,
        store: store
    })
};


exports.updateStore = async (req, res) => {
    //set a location data to be point because we loseing it
    req.body.location.type = 'Point';
    // 1.Find and update the store
    const store = await Store.findOneAndUpdate({_id: req.params.id},
        req.body, {
            new: true, // return new store instead of old one(updated data)
            runValidators: true //force model to run required validators
        }).exec(); //run
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. 
                <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);

    // Redirect them to the store and tell them it worked
};


exports.getStoreBySlug = async (req, res, next) => {

    //query the database
    const store = await Store.findOne({slug: req.params.slug})
    //that will give all info about author(user);
        .populate('author');
    //this inside our app.js will pass our routes and go next to error middleware
    if (!store) return next();
    res.render('store', {store, title: store.name});


};


exports.getStoresByTag = async (req, res) => {

    const tag = req.params.tag;

    //is tag not exist then give any store that has tag property
    //it will show all stores that has at least one tag
    const tagQuery = tag || {$exists: true};

    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});

    //run both functions asynchronously like (await for both)
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);


    res.render('tags', {tags, title: 'Tags', tag, stores});

};


exports.mapPage = (req,res) => {
    res.render('map', {title: 'Map page'})
};


/*
 API
 */


exports.searchStores = async (req, res) => {
    const stores = await Store
    //find stores that match
        .find({
            $text: {
                $search: req.query.q
            }
        }, {
            score: {$meta: 'textScore'}
        })
        //sort them
        .sort({
            score: {$meta: 'textScore'}
        })
        //limit to only 5 results
        .limit(5);

    res.json(stores);
};


exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    //mongoDB $near let as search stores that ar near with 10km using $near and $maxDistance
    const q = {
      location: {
          $near:{
              $geometry:{
                  type: 'Point',
                  coordinates: coordinates
              },
              $maxDistance: 10000 //10km
          }
      }
    };


    //select gives to select json attributes that we want e.g.
    //just to show select('photo name')
    //delete some select('-photo -name')
    //limit how many stores to show
    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);

};




