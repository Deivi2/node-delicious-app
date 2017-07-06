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

}, {
    //any time actual document converted either to JSON or Object then bring virtuals for a ride :D
    //even if they are invisible still show virtuals together with stores
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//define indexes
storeSchema.index({
    name: 'text',
    description: 'text'
});


//location on map
storeSchema.index({location: '2dsphere'});


//before save

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

//tags aggregation
//will filter our tags in tag page

storeSchema.statics.getTagsList = function () {
    //aggregate will take array of passable operators we looking for
    return this.aggregate([
        {$unwind: '$tags'},
        {$group: {_id: '$tags', count: {$sum: 1}}},
        {$sort: {count: -1}}
    ]);
};


//top page aggregation

storeSchema.statics.getTopStores = function () {
//its like .find just more complex
    return this.aggregate([
        //Look Stores and populate their review
        //mongoDB will take Review and make it reviews
        {
            $lookup: {
                from: 'reviews', localField: '_id',
                foreignField: 'store', as: 'reviews'
            }
        },
        //Filter for only items that have 2 or more reviews
        { $match: {'reviews.1': { $exists: true}}},
        //Add the average reviews fields
        { $project: {//project is add field
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            reviews: '$$ROOT.reviews',
            slug: '$$ROOT.slug',
            avarageRating: { $avg: '$reviews.rating'}
        }},
        //sort it by our new fields, highest reviews first
        { $sort: { avarageRating: -1}},
        //limit to at most 10
        { $limit: 10}

    ])
};


//virtually populate

//!!store.reviews property will have access to reviews from store

//find reviews where the stores _id === reviews store property
storeSchema.virtual('reviews', {
    ref: 'Review', //what model to link?
    localField: '_id', //which field on the store?
    foreignField: 'store' //which field on the review?
});


//auto populate on storeController/getStores middleware
//when ever we query for store it will bring reviews to store


function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);


module.exports = mongoose.model('Store', storeSchema);
