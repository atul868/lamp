const config = require('config');
const version = config.get('version');

const data = {
  image: '/upload/12.jpeg',
  type: 'Category',
  order: 1,
  activatedAt: '2020-10-05T07:47:48.315Z',
  expiredAt: '2020-10-08T07:47:48.316Z',
  useFor: 'SLIDER'
};
let token;
let slider;
describe('Banner', () => {
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
  it('it should be able to create slider ', async () => {
    const res = await request
      .post(`/${version}/Banner/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
    slider = res.body;
  });
  it('it should be able to get a slider ', async () => {
    await request
      .get(`/${version}/Banner/${slider._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to get a slider with invalid id ', async () => {
    await request
      .get(`/${version}/Banner/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
  it('it should be able to get all sliders ', async () => {
    await request
      .get(`/${version}/Banner/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should be able to edit a slider', async () => {
    await request
      .put(`/${version}/Banner/${slider._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ type: 'SubCategory' })
      .expect(200);
  });
  it('it should be able to delete a slider', async () => {
    await request
      .delete(`/${version}/Banner/${slider._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to delete a slider with invalid id', async () => {
    await request
      .delete(`/${version}/Banner/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
});
