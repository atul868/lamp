const _ = require('lodash');
const Facade = require('../../lib/facade');
const schemeSchema = require('./schema');
const ProductModel = require('../product/schema');
const CartModel = require('../cart/schema');
class SchemeFacade extends Facade {
  async applyScheme(MemberId) {
    const carts = await CartModel.find({ memberId: MemberId }).populate(
      'productId relatedProductId productId.scheme'
    );
    const cartTotal = _.sumBy(carts, 'discountedPrice');
    for (const cart of carts) {
      if (cart.productId && cart.productId.scheme) {
        if (cart.productId.oneRuppeeScheme) {
          const oneRuppee = await schemeSchema.findOne({
            productId: cart.productId.relatedProduct,
            relatedProductId: cart.productId._id
          });
          if (oneRuppee) {
            const discountedPrice = 1;
            const taxAmount = (discountedPrice * cart.productId.tax) / 100;
            await CartModel.updateOne(
              { _id: cart._id },
              {
                discountedPrice,
                taxAmount
              }
            );
          }
          await ProductModel.updateOne(
            { productId: cart.productId._id },
            {
              $set: {
                oneRuppeeScheme: false,
                relatedProduct: null
              }
            }
          );
        }
        for (let scheme of cart.productId.scheme) {
          scheme = await schemeSchema.findById(scheme).populate('relatedProductId');
          if (scheme && scheme.isActive) {
            if (scheme.type === 'Couple Discounts') {
              try {
                const relatedProduct = await CartModel.findOne({
                  memberId: MemberId,
                  productId: scheme.relatedProductId._id
                }).populate('productId');
                if (scheme.discountPercentage === 100) {
                  if (relatedProduct) {
                    relatedProduct.discountedPrice = 0;
                    relatedProduct.tax = 0;
                    await relatedProduct.save();
                  } else {
                    const discountedPrice = 0;
                    const cartData = {
                      quantity: 1,
                      productId: scheme.relatedProductId._id,
                      memberId: MemberId,
                      discount: null,
                      discountedPrice,
                      taxAmount: 0,
                      productName: scheme.relatedProductId.name,
                      price: scheme.relatedProductId.price
                    };
                    try {
                      await CartModel.create(cartData);
                    } catch (err) {
                      console.log('Error', err);
                    }
                  }
                } else if (relatedProduct) {
                  const discountedPrice =
                    relatedProduct.productId.price -
                    (relatedProduct.productId.price *
                      relatedProduct.quantity *
                      relatedProduct.packagingSize *
                      scheme.discountPercentage) /
                      100;
                  const taxAmount = (discountedPrice * relatedProduct.productId.tax) / 100;
                  await CartModel.updateOne(
                    {
                      memberId: MemberId,
                      productId: scheme.relatedProductId
                    },
                    {
                      $set: {
                        discountedPrice,
                        taxAmount
                      }
                    }
                  );
                }
              } catch (error) {
                console.log('Error', error);
              }
            } else if (scheme.type === 'Points Added') {
              if (cartTotal >= scheme.requiredAmount) {
                try {
                  await CartModel.updateOne(
                    { memberId: MemberId, productId: cart.productId._id },
                    {
                      $set: {
                        points: cart.points + scheme.additionalPoints
                      }
                    }
                  );
                } catch (error) {
                  console.log('Error', error);
                }
              }
            } else if (scheme.type === 'Overall Free') {
              if (cartTotal >= scheme.requiredAmount) {
                const discountedPrice = 0;
                const cartData = {
                  quantity: 1,
                  productId: scheme.relatedProductId._id,
                  memberId: MemberId,
                  discount: null,
                  discountedPrice,
                  taxAmount: 0,
                  productName: scheme.relatedProductId.name,
                  price: scheme.relatedProductId.price
                };
                try {
                  await CartModel.create(cartData);
                } catch (err) {
                  console.log('Error', err);
                }
              }
            } else if (scheme.type === 'Quantity Discount') {
              if (cart.quantity >= scheme.requiredQuantity) {
                const product = await CartModel.findOne({
                  memberId: MemberId,
                  productId: cart.productId._id
                }).populate('productId');
                if (scheme.discountAmount) {
                  try {
                    const discountedPrice = product.price - scheme.discountAmount;
                    const taxAmount = (product.discountedPrice * product.productId.tax) / 100;
                    await CartModel.updateOne(
                      { memberId: MemberId, productId: cart.productId._id },
                      {
                        $set: {
                          discountedPrice,
                          taxAmount
                        }
                      }
                    );
                  } catch (error) {
                    console.log('Error', error);
                  }
                } else if (scheme.discountPercentage) {
                  try {
                    const discountedPrice = product.price - (product.price * scheme.discountPercentage) / 100;
                    const taxAmount = (product.discountedPrice * product.productId.tax) / 100;
                    await CartModel.updateOne(
                      { memberId: MemberId, productId: cart.productId._id },
                      {
                        $set: {
                          discountedPrice,
                          taxAmount
                        }
                      }
                    );
                  } catch (error) {
                    console.log('Error', error);
                  }
                }
              }
            } else if (scheme.type === 'One Rupee') {
              if (cartTotal >= scheme.requiredAmount) {
                await ProductModel.updateOne(
                  { _id: scheme.relatedProductId._id },
                  {
                    $set: {
                      oneRuppeeScheme: true,
                      relatedProduct: cart.productId._id
                    }
                  }
                );
                await CartModel.updateOne(
                  {
                    memberId: MemberId,
                    productId: scheme.productId
                  },
                  {
                    $set: {
                      suggestedProduct: scheme.relatedProductId._id
                    }
                  }
                );
              } else {
                await ProductModel.updateOne(
                  { productId: scheme.relatedProductId._id },
                  {
                    $set: {
                      oneRuppeeScheme: false,
                      relatedProduct: null
                    }
                  }
                );
                await CartModel.updateOne(
                  {
                    memberId: MemberId,
                    productId: scheme.productId
                  },
                  {
                    $set: {
                      suggestedProduct: null
                    }
                  }
                );
              }
            } else if (scheme.type === 'First User') {
              if (scheme.users > scheme.redeemed) {
                try {
                  await CartModel.updateOne(
                    { memberId: MemberId, productId: cart.productId._id },
                    {
                      $set: {
                        points: cart.points + scheme.additionalPoints
                      }
                    }
                  );
                  await schemeSchema.updateOne(
                    { _id: scheme._id },
                    {
                      $inc: {
                        redeemed: 1
                      }
                    }
                  );
                } catch (error) {
                  console.log('Error', error);
                }
              } else {
                await schemeSchema.updateOne(
                  { _id: scheme._id },
                  {
                    $set: {
                      isActive: false
                    }
                  }
                );
              }
            }
          }
        }
      }
    }
  }
}

module.exports = new SchemeFacade(schemeSchema);
