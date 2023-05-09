const _ = require('lodash');
const config = require('config');
const FeedbackModel = require('./schema');

const reqDemoFacade = require('./facade');

class FeedbackController {
  async create(req, res, next) {
    let feedback;
    try {
      feedback = await FeedbackModel.create(req.body);
    } catch (err) {
      console.log(err)
      return next(err);
    }
    res.send(feedback);
  }

  async edit(req, res, next) {
    const { FeedbackId } = req.params;
    const d = {
      title: null,
      message: null,
      rating: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));

    try {
      await FeedbackModel.updateOne({ _id: FeedbackId }, obj);
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Feedback Updated' });
  }

  async getFeedback(req, res, next) {
    let feedback;
    const { FeedbackId } = req.params;
    try {
      feedback = await FeedbackModel.findById(FeedbackId).populate('user');
    } catch (err) {
      return next(err);
    }
    if (!feedback) {
      const e = new Error('Feedback Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(feedback);
  }

  async select(req, res, next) {
    let feedbacks;
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
      feedbacks = await FeedbackModel.find(query)
        .populate('user')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: feedbacks
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await FeedbackModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { FeedbackId } = req.params;
    let feedback;
    try {
      feedback = await FeedbackModel.findById(FeedbackId);
    } catch (err) {
      return next(err);
    }
    if (!feedback) {
      const e = new Error('Feedback Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await FeedbackModel.deleteOne({ _id: FeedbackId });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Feedback Deleted' });
  }
}

module.exports = new FeedbackController(reqDemoFacade);
