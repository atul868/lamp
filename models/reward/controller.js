const _ = require('lodash');
const config = require('config');
const RewardModel = require('./schema');

const rewardFacade = require('./facade');

class RewardController {
  async create(req, res, next) {
    let reward;
    const { title, description, points, role, image } = req.body;
    try {
      reward = await RewardModel.findOne({ title });
    } catch (err) {
      return next(err);
    }
    if (reward) {
      const e = new Error('Reward Already exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      reward = await RewardModel.create({
        title,
        description,
        image,
        points,
        role
      });
    } catch (err) {
      return next(err);
    }
    res.send(reward);
  }

  async edit(req, res, next) {
    const { RewardId } = req.params;
    const d = {
      title: null,
      description: null,
      image: null,
      points: null,
      role: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));

    try {
      await RewardModel.updateOne({ _id: RewardId }, obj);
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Reward Updated' });
  }

  async getReward(req, res, next) {
    let reward;
    const { RewardId } = req.params;
    try {
      reward = await RewardModel.findById(RewardId);
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
    const { title } = req.query;
    let meta;
    const query = {};
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';

    if (title) {
      query.title = {
        $regex: new RegExp(title.toLowerCase().replace(/\s+/g, '\\s+'), 'gi')
      };
    }
    try {
      rewards = await RewardModel.find(query)
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
        totalRecords: await RewardModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { RewardId } = req.params;
    let reward;
    try {
      reward = await RewardModel.findById(RewardId);
    } catch (err) {
      return next(err);
    }
    if (!reward) {
      const e = new Error('Reward Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await RewardModel.deleteOne({ _id: RewardId });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Reward Deleted' });
  }
}

module.exports = new RewardController(rewardFacade);
