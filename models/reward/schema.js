const mongoose = require('mongoose');
const _ = require('lodash');
const fileUtil = require('../../utils/file');
const { Schema } = mongoose;

const rewardSchema = new Schema({
  title: { type: String, required: [true, 'Title is required'], unique: true, min: 2, max: 25 },
  description: { type: String, required: [true, 'Description is required'] },
  points: { type: Number, required: [true, 'Points are required'] },
  role: { type: String, required: [true, 'Role is required'] },
  image: [{ type: Schema.Types.Mixed }]
});

module.exports = mongoose.model('rewards', rewardSchema);

rewardSchema.set('toJSON', {
  virtuals: true
});

rewardSchema.set('toObject', {
  virtuals: true
});

rewardSchema.virtual('signedUrl').get(function() {
  if (!_.isEmpty(this.image)) {
    const images = [];
    for (const image of this.image) {
      image.url = fileUtil.getSignedUrl(image.url);
      images.push(image);
    }
    return images;
  }
});
