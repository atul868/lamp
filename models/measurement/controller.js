const _ = require('lodash');
const config = require('config');
const MeasurementModel = require('./schema');

const measurementFacade = require('./facade');

class MeasurementController {
  async create(req, res, next) {
    let measurement;
    const { name, slug } = req.body;
    try {
      measurement = await MeasurementModel.findOne({ name });
    } catch (err) {
      return next(err);
    }
    if (measurement) {
      const e = new Error('Measurement Already exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      measurement = await MeasurementModel.findOne({ slug });
    } catch (err) {
      return next(err);
    }
    if (measurement) {
      const e = new Error('Measurement Already exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      measurement = await MeasurementModel.create({
        name,
        slug
      });
    } catch (err) {
      return next(err);
    }
    res.send(measurement);
  }

  async edit(req, res, next) {
    const { MeasurementId } = req.params;
    const d = {
      name: null,
      slug: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));

    try {
      await MeasurementModel.updateOne({ _id: MeasurementId }, obj);
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Measurement Updated' });
  }

  async getMeasurement(req, res, next) {
    let measurement;
    const { MeasurementId } = req.params;
    try {
      measurement = await MeasurementModel.findById(MeasurementId);
    } catch (err) {
      return next(err);
    }
    if (!measurement) {
      const e = new Error('Measurement Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(measurement);
  }

  async select(req, res, next) {
    let measurements;
    let { page, limit, sortBy } = req.query;
    const { name } = req.query;
    let meta;
    const query = {};
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';

    if (name) {
      query.name = {
        $regex: new RegExp(name.toLowerCase().replace(/\s+/g, '\\s+'), 'gi')
      };
    }
    try {
      measurements = await MeasurementModel.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: measurements
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await MeasurementModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { MeasurementId } = req.params;
    let measurement;
    try {
      measurement = await MeasurementModel.findById(MeasurementId);
    } catch (err) {
      return next(err);
    }
    if (!measurement) {
      const e = new Error('Measurement Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await MeasurementModel.deleteOne({ _id: MeasurementId });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Measurement Deleted' });
  }
}

module.exports = new MeasurementController(measurementFacade);
