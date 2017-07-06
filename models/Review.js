const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = mongoose.Schema({

    created: {
        type: Date,
        default: Date.now()
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author!'
    },
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You must supply a store!'
    },
    text: {
        type: String,
        required: 'Your review must have text!'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
});


//automatically populate author field
function autoPopulate(next) {
    this.populate('author');
    next();
}

//add hooks in somebody find ar findsOne, it going to populate author field of each of those
//so reviews will get author fields in review JSON object
reviewSchema.pre('find', autoPopulate);
reviewSchema.pre('findOne', autoPopulate);


module.exports = mongoose.model('Review', reviewSchema);
