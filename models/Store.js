const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please Enter a store name'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: true
        }],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply author'
    }
});

//define indexes
storeSchema.index({
    name: 'text',
    description: 'text'
});


//location on map
storeSchema.index({ location: '2dsphere' });




storeSchema.pre('save', async function (next) {
    if (!this.isModified('name')) {
        next(); //skip it
        return; //stop this function from running
    }
    this.slug = slug(this.name);
    //find other store that have a slug of wes, wes-1, wes-2
    //^ <- starts with $ <- ends with
    const slugRexEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');

    //this.constructor will be equals to Store that actually runs
    const storesWithSlug = await this.constructor.find({slug: slugRexEx});
    console.log('store slug', storesWithSlug);
    console.log('store slug length ', storesWithSlug.length);

    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`
    }

    next();
    //TODO make more resilient so slugs are unique
});


storeSchema.statics.getTagsList = function () {
    //aggregate will take array of paseble operators we looking for
    return this.aggregate([
        {$unwind: '$tags'},
        {$group: {_id: '$tags', count: {$sum: 1}}},
        {$sort: {count: -1}}
    ]);
};

module.exports = mongoose.model('Store', storeSchema);
