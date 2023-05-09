const config = require('config');
const version = config.get('version');
const categoryData = {
  tags: ['Medicine', 'Most-selling'],
  visible: true,
  name: 'New Cat For Test',
  order: 3
};
const subCategoryData = {
  tags: ['Medicine'],
  visible: true,
  name: 'New Sub Category For Testing'
};
const parentProductData = {
  alternativeNames: ['Diabetes', 'Cipla'],
  name: 'Diabetes b',
  description: 'Medicine For Diabetes',
  category: [],
  subCategory: []
};
const data = {
  inStockQuantity: 20,
  price: 100,
  packagingSize: [10, 20, 30, 40],
  name: 'Cacity 20mg',
  measuringUnit: 'Grams',
  dosageSize: '20mg',
  description: '10x10',
  pieces: 100
};
let token;
let product;
let measurement;
describe('PRODUCT', () => {
  it('it should be able to login account', async () => {
    const res = await request
      .post(`/${version}/Member/Login`)
      .send({
        email: 'jatinmotwani77@gmail.com',
        password: 'itsgreat'
      })
      .expect(200);
    token = res.body;
  });
  it('it should be able to create category ', async () => {
    const res = await request
      .post(`/${version}/Category/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(categoryData)
      .expect(200);
    subCategoryData.parent = res.body._id;
    parentProductData.category.push(res.body._id);
  });
  it('it should be able to create subcategory ', async () => {
    const res = await request
      .post(`/${version}/SubCategory/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(subCategoryData)
      .expect(200);
    data.subCategory = res.body._id;
    parentProductData.subCategory.push(res.body._id);
  });
  it('it should be able to create measurement ', async () => {
    const res = await request
      .post(`/${version}/Measurement/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ name: 'K Grams', slug: 'Kg' })
      .expect(200);
    measurement = res.body;
  });
  it('it should be able to create parent product ', async () => {
    const res = await request
      .post(`/${version}/ParentProduct/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(parentProductData)
      .expect(200);
    data.parentProduct = res.body._id;
  });
  it('it should be able to create product ', async () => {
    data.measuringUnit = measurement._id;
    const res = await request
      .post(`/${version}/Product/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
    product = res.body;
  });
  it('it should be able to get a product ', async () => {
    await request
      .get(`/${version}/Product/${product._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to get a product with invalid id ', async () => {
    await request
      .get(`/${version}/Product/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
  it('it should be able to get all product ', async () => {
    await request
      .get(`/${version}/Product/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should be able to edit a product', async () => {
    await request
      .put(`/${version}/Product/${product._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ name: 'Dolo' })
      .expect(200);
  });
  it('it should be able to delete a product', async () => {
    await request
      .delete(`/${version}/Product/${product._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to delete a product with invalid id', async () => {
    await request
      .delete(`/${version}/Product/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
});
