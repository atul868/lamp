const _ = require('lodash');
const config = require('config');
const RewardRedeemModel = require('./schema');
const RewardModel = require('../reward/schema');
const MemberModel = require('../member/schema');

const rewardRedeemFacade = require('./facade');

class RewardRedeemController {
  async getRewardRedeem(req, res, next) {
    let reward;
    const { RewardRedeemId } = req.params;
    try {
      reward = await RewardRedeemModel.findById(RewardRedeemId).populate('reward');
    } catch (err) {
      return next(err);
    }
    if (!reward) {
      const e = new Error('Reward Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(reward);
  }

  async select(req, res, next) {
    let rewards;
    let { page, limit, sortBy } = req.query;
    let meta;
    const query = {};
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';

    try {
      rewards = await RewardRedeemModel.find(query)
        .populate('reward')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: rewards
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await RewardRedeemModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async rewardRequest(req, res, next) {
    let rewardRequest;
    const { reward } = req.body;
    const { member } = req;
    const user = member._id;
    const status = 'Pending';
    try {
      rewardRequest = await RewardRedeemModel.create({
        reward,
        user,
        status
      });
    } catch (err) {
      return next(err);
    }
    // await applyScheme(scheme);
    res.send(rewardRequest);
  }

  async review(req, res, next) {
    const { RewardRedeemId } = req.params;
    const d = {
      status: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));

    try {
      await RewardRedeemModel.updateOne({ _id: RewardRedeemId }, obj);
    } catch (err) {
      return next(err);
    }
    if (obj.status === 'Approved') {
      try {
        const rewardRequest = await RewardRedeemModel.findById(RewardRedeemId);
        if (rewardRequest) {
          const reward = await RewardModel.findById(rewardRequest.reward);
          if (reward) {
            await MemberModel.updateOne(
              { _id: rewardRequest.user },
              {
                $inc: {
                  points: reward.points
                }
              }
            );
          }
        }
      } catch (error) {
        return next(error);
      }
    }
    res.json({ message: 'Reward Request Reviewed' });
  }
}

module.exports = new RewardRedeemController(rewardRedeemFacade);
