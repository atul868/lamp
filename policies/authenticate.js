const authUtil = require('../utils/auth');
const rolesFacade = require('../models/roles/facade');
const userFacade = require('../models/member/facade');

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization');
  console.log('token', token);
  if (!token) {
    const error = new Error('Auth token missing');
    error.statusCode = 401;
    return next(error);
  }
  try {
    const userExist = await authUtil.findByToken(token);
    console.log('userExist', userExist);
    if (!userExist) {
      const error = new Error('Invalid token');
      error.statusCode = 401;
      return next(error);
    }
    const user = await userFacade.findOne({ _id: userExist._id });

    if (!user) {
      const error = new Error('Invalid token');
      error.statusCode = 401;
      return next(error);
    }
    const role = await rolesFacade.findOne({ _id: user.role });

    if (!user) {
      const error = new Error('Invalid User');
      error.statusCode = 401;
      return next(error);
    }

    if (user.isBlocked) {
      const error = new Error('User has been blocked');
      error.statusCode = 401;
      return next(error);
    }
    req.member = user;
    req.role = role;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authenticate;
