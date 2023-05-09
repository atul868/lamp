const _ = require('lodash');
const config = require('config');
const locationsModel = require('./schema');

const reqDemoFacade = require('./facade');

class locationsController {
  async create(req, res, next) {
    let locations;
    try {
      locations = await locationsModel.create(req.body);
    } catch (err) {
      console.log(err)
      return next(err);
    }
    res.send(locations);
  }

  async edit(req, res, next) {
    try {
      await locationsModel.updateOne({ _id: locationsId }, req.body);
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'locations Updated' });
  }

  async getlocations(req, res, next) {
    let locations;
    const { machineIds } = req.params;
    try {
      locations = await locationsModel.find({machineIds : {$in : machineIds}});
    } catch (err) {
      return next(err);
    }
    if (!locations || locations.length == 0) {
      const e = new Error('locations Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(locations);
  }

  async select(req, res, next) {
    let locationss;
    let { page, limit, sortBy } = req.query;
    const { location } = req.query;
    let meta;
    const query = {};
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';

    if (location) {
      query.location = {
        $regex: new RegExp(title.toLowerCase().replace(/\s+/g, '\\s+'), 'gi')
      };
    }
    try {
      locationss = await locationsModel.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: locationss
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await locationsModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { locationsId } = req.params;
    let locations;
    try {
      locations = await locationsModel.findById(locationsId);
    } catch (err) {
      return next(err);
    }
    if (!locations) {
      const e = new Error('locations Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await locationsModel.deleteOne({ _id: locationsId });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'locations Deleted' });
  }
}

module.exports = new locationsController(reqDemoFacade);
