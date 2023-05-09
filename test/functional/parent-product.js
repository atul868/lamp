const config = require('config');
const version = config.get('version');
const categoryData = {
  tags: ['Medicine', 'Most-selling'],
  visible: true,
  name: 'Treding',
  order: 1
};
const subCategoryData = {
  tags: ['Medicine'],
  visible: true,
  name: 'New Sub Category'
};
const data = {
  spellingMistakes: ['Diabetes', 'Cipla'],
  competitorNames: ['Diabetes', 'Cipla'],
  salts: ['Diabetes', 'Cipla'],
  name: 'Diabetes',
  description: 'Medicine For Diabetes',
  subCategory: [],
  category: [],
  images: [
    { path: 'F_C8Zclyn.jpg', isPrimary: true },
    { path: 'F_C8Zclyn.jpg', isPrimary: true }
  ],
  indications: 'test',
  dosage: 'take as much as you can',
  warning: 'take a chill pill',
  storageInstructions: 'No need to store',
  products: [
    {
      inStockQuantity: 20,
      price: 100,
      packagingSize: [10, 20, 30, 40],
      name: 'Dabur Gulabari',
      measuringUnit: 'Grams',
      dosageSize: '20mg',
      description: '10x10',
      pieces: 100
    }
  ]
};
let token;
let parentProduct;
let measurement;
describe('PARENT_PRODUCT', () => {
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
    data.category.push(res.body._id);
    subCategoryData.parent = res.body._id;
  });
  it('it should be able to create subcategory ', async () => {
    const res = await request
      .post(`/${version}/SubCategory/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(subCategoryData)
      .expect(200);
    data.subCategory.push(res.body._id);
  });
  it('it should be able to create measurement ', async () => {
    const res = await request
      .post(`/${version}/Measurement/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ name: 'Grams', slug: 'KG' })
      .expect(200);
    measurement = res.body;
  });
  it('it should be able to create parent product ', async () => {
    data.products[0].measuringUnit = measurement._id;
    const res = await request
      .post(`/${version}/ParentProduct/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
    parentProduct = res.body;
  });
  it('it should be able to get a parent product ', async () => {
    await request
      .get(`/${version}/ParentProduct/${parentProduct._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to get a parent product with invalid id ', async () => {
    await request
      .get(`/${version}/ParentProduct/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
  it('it should be able to get all parent product ', async () => {
    await request
      .get(`/${version}/ParentProduct/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should be able to edit a parent product', async () => {
    await request
      .put(`/${version}/ParentProduct/${parentProduct._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ name: 'Dolo' })
      .expect(200);
  });
  it('it should be able to get a parent product', async () => {
    await request
      .get(`/${version}/ParentProduct/${parentProduct._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it.skip('it should be able to delete a parent product', async () => {
    await request
      .delete(`/${version}/ParentProduct/${parentProduct._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to delete a parent product with invalid id', async () => {
    await request
      .delete(`/${version}/ParentProduct/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
});
