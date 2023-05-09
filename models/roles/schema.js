const mongoose = require('mongoose');
const { Schema } = mongoose;

const roles = new Schema(
  {
    _id: String,
    modules: [{ type: String }]
  },
  {
    versionKey: false,
    timestamps: true,
    id: false
  }
);

roles.set('toJSON', {
  virtuals: true
});
roles.set('toObject', {
  virtuals: true
});

const rolesSchema = mongoose.model('roles', roles);

module.exports = rolesSchema;
