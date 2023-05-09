const config = require('config');
const version = config.get('version');
const categoryData = {
  tags: ['Medicine', 'Most-selling'],
  visible: true,
  name: 'Best Seller',
  order: 1
};
const data = {
  tags: ['Medicine'],
  visible: true,
  name: 'Paracetemol'
};
let token;
let subCategory;
describe('SUB-CATEGORY', () => {
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
    data.parent = res.body._id;
  });
  it('it should be able to create sub category ', async () => {
    const res = await request
      .post(`/${version}/SubCategory/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
    subCategory = res.body;
  });
  it('it should be able to get a sub category ', async () => {
    await request
      .get(`/${version}/SubCategory/${subCategory._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to get a sub category with invalid id ', async () => {
    await request
      .get(`/${version}/SubCategory/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
  it('it should be able to get all sub category ', async () => {
    await request
      .get(`/${version}/SubCategory/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should be able to edit a sub category', async () => {
    await request
      .put(`/${version}/SubCategory/${subCategory._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ name: 'Dolo' })
      .expect(200);
  });
  it('it should be able to delete a sub category', async () => {
    await request
      .delete(`/${version}/SubCategory/${subCategory._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to delete a sub category with invalid id', async () => {
    await request
      .delete(`/${version}/SubCategory/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
});
