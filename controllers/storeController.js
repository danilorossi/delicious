const mongoose = require('mongoose');
const Store = mongoose.model('Store');
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
