const mongoose = require('mongoose');

const { Schema } = mongoose;

const rewardRedeemSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'member', required: [true, 'User is required'] },
  reward: { type: Schema.Types.ObjectId, ref: 'rewards', required: [true, 'Reward is required'] },
  status: { type: String, enum: ['Approved', 'Rejected', 'Pending'], default:'Pending' }
});

module.exports = mongoose.model('reward-redeem', rewardRedeemSchema);
