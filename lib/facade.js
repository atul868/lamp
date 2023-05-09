const Promise = require('bluebird');

class Facade {
  constructor(Schema) {
    this.Schema = Schema;
  }

  // create
  create(query) {
    return new Promise((resolve, reject) => {
      this.Schema.create(query)
        .then(result => resolve(result))
        .catch(e => reject(e));
    });
  }

  // update
  update(query, update, options) {
    return new Promise((resolve, reject) => {
      this.Schema.updateOne(query, update, options)
        .then(result => resolve(result))
        .catch(e => reject(e));
    });
  }

  upsert(query, update) {
    return new Promise((resolve, reject) => {
      this.Schema.findOneAndUpdate(query, update, { upsert: true, new: true })
        .then(result => resolve(result))
        .catch(e => reject(e));
    });
  }

  findOneAndUpdate(where, body) {
    return new Promise((resolve, reject) => {
      this.Schema.findOneAndUpdate(where, body, { upsert: false, new: false })
        .then(result => resolve(result))
        .catch(e => reject(e));
    });
  }

  // delete by id
  destroy(query) {
    return new Promise((resolve, reject) => {
      this.Schema.findOneAndDelete(query)
        .then(result => resolve(result))
        .catch(e => reject(e));
    });
  }

  // find One
  findOne(query, projection, options, include) {
    return new Promise((resolve, reject) => {
      this.Schema.findOne(query, projection, options)
        .populate(include)
        .then(result => {
          resolve(result);
        })
        .catch(e => reject(e));
    });
  }

  // findAll
  findAll(query, projection, options) {
    let include = null;
    if (options) include = options.populate;
    return new Promise((resolve, reject) => {
      this.Schema.find(query, projection, options)
        .populate(include)
        .then(result => resolve(result))
        .catch(e => reject(e));
    });
  }

  // aggregate
  aggregate(query, update, options) {
    return new Promise((resolve, reject) => {
      this.Schema.aggregate(query, update, options)
        .then(result => resolve(result))
        .catch(e => reject(e));
    });
  }
}

module.exports = Facade;
