const Facade = require('../../lib/facade');
const orderSchema = require('./schema');
class OrderFacade extends Facade {
  async orderId() {
    let i = 100000;
    let newOrderId = `SE${i}`;
    let uniqueOrder = await this.findOne({ orderId: newOrderId });
    while (uniqueOrder) {
      newOrderId = `SE${i}`;
      uniqueOrder = await this.findOne({ orderId: newOrderId });
      i += 1;
    }
    return newOrderId;
  }

  async createTimeline(order, createdBy) {
    order.timeLine.push({ status: order.status, createdBy });
    try {
      await orderSchema.updateOne({ _id: order._id }, order);
    } catch (error) {
      return error;
    }
  }
}

module.exports = new OrderFacade(orderSchema);
