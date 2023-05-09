const config = require('config');
const version = config.get('version');
const data = {
  tags: ['Medicine', 'Most-selling'],
  visible: true,
  name: 'Best Seller',
  order: 1
};
let token;
let category;
describe('CATEGORY', () => {
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
      .send(data)
      .expect(200);
    category = res.body;
  });
  it('it should not be able to create category, with same name  ', async () => {
    await request
      .post(`/${version}/Category/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(400);
  });
  it('it should be able to get a category ', async () => {
    await request
      .get(`/${version}/Category/${category._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to get a category with invalid id ', async () => {
    await request
      .get(`/${version}/Category/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
  it('it should be able to get all category ', async () => {
    await request
      .get(`/${version}/Category/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should be able to edit a category', async () => {
    await request
      .put(`/${version}/Category/${category._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ name: 'Cardiac' })
      .expect(200);
  });
  it('it should be able to delete a category', async () => {
    await request
      .delete(`/${version}/Category/${category._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to delete a category with invalid id', async () => {
    await request
      .delete(`/${version}/Category/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
});
