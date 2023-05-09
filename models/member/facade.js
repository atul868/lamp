const _ = require('lodash');
const Facade = require('../../lib/facade');
const userSchema = require('./schema');
class MemberFacade extends Facade {
  async userId(name) {
    let i = 1001;
    if (name.indexOf(' ') !== -1) name = name.substr(0, name.indexOf(' '));
    let newUserId = `${name}${i}`;
    let userUnique = await this.findOne({ userId: newUserId });
    while (userUnique) {
      newUserId = `${name}${i}`;
      userUnique = await this.findOne({ userId: newUserId });
      i += 1;
    }
    return newUserId;
  }

  async recentlyViewed(user, product) {
    const recentlyViewed = _.orderBy(user.recentlyViewed, 'createdAt', 'desc');
    if (recentlyViewed.length > 10) {
      recentlyViewed.pop();
      recentlyViewed.push({ productId: product._id });
    } else {
      recentlyViewed.push({ productId: product._id });
    }
    user.recentlyViewed = _.uniqBy(recentlyViewed, p => p.productId.toString());
    return user.save();
  }
}

module.exports = new MemberFacade(userSchema);
