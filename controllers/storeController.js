const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype is not allowed!'}, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('index',  { title: 'Home' });
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if(!req.file) {
    next(); // skip to next middleware
  }
  // NOTE DO NOT RELY on file extension, better MIMETYPE
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id; // take id of current logged in user
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
}

exports.updateStore = async (req, res) => {
  // set the default schema values (they are not applyed on UPDATE, only on CREATE)
  req.body.location.type = 'Point';
  // find update store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return new store instead of the old One
    runValidators: true,
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
  // redirect to store and tell it worked
  res.redirect(`/stores/${store._id}/edit`);
}

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
}


const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) { // || user.level < 10 etc.
    throw Error('You must own a store in order to edit it!');
  }
}
exports.editStore = async (req, res) => {
  // find the store given the id
  const store = await Store.findOne({ _id: req.params.id });
  // confirm they are the owner of the stores
  confirmOwner(store, req.user);
  // render out the edit form
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author');

  // 404
  if(!store) {
    return next();
  }

  res.render('store', { store, title: store.name });
}

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true }; // no tag, all stores

  const tagsPromise = Store.getTagsList();
  const storesPromise = await Store.find({ tags: tagQuery });
  const result = await Promise.all([tagsPromise, storesPromise]);
  const [ tags, stores ] = result;
  res.render('tags', { tags, stores, title: 'Tags', tag})
}

exports.searchStores = async (req, res) => {
  const stores = await Store
  // find stores that matches
  .find({
    $text: { // search on all indexes of type 'text'
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // sort them
  .sort({
    score: { $meta: 'textScore'}
  })
  // limit to 5 results
  .limit(5);
  console.log('> limiting to top 5 results');
  res.json(stores);
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);

  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // meters = 10 km
      }
    }
  };

  console.log('> limiting to top 10 results');
  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
}

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
}

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString())
  const storeId = req.params.id;
  const operator = hearts.includes(storeId) ?
    '$pull' :
    '$addToSet'

  const user = await User
    .findOneAndUpdate(req.user._id,
      { [operator]: { hearts: storeId } },
      { new: true }
    )
  res.json(user)
}

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render('stores', { title: 'Hearted Stores', stores });
};
