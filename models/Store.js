const mongoose = require('mongoose')

mongoose.Promise = global.Promise

const slug = require('slugs') // URL friendly names

// strict schema by default, will only take the declared fields from the passed object
const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String, // auto generated
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  create: {
    type: Date,
    default: Date.now // NOTE what about timezones?
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String
})

storeSchema.pre('save', async function(next) {
  // no arrow func, we need THIS
  if(!this.isModified('name')) {
    return next()
  }
  this.slug = slug(this.name)
  // make more resilient so slugs are unique
  // find already existing slugs x, x-1, x-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i')
  // ^() starts with slug
  // ()$ ends with
  // i > case insensitive

  // Store = this.constructor
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });

  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  next()
})

// NOTE do not use ARRAOW FUNCTION, we need to use THIS inside
// referring to the actual model
storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' }, // $ > field on my doc
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
}

module.exports = mongoose.model('Store', storeSchema)
