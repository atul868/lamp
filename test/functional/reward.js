const config = require('config');
const version = config.get('version');
const Role = require('../../models/roles/schema');
const data = {
  title: 'Mega Reward',
  description: 'It Is Mega Reward',
  points: 300,
  role: 'retailer'
};
let token;
let reward;
describe('Reward', () => {
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
  it('it should be able to create reward ', async () => {
    const res = await request
      .post(`/${version}/Reward/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
    reward = res.body;
  });
  it('it should not be able to create reward, with same title  ', async () => {
    await request
      .post(`/${version}/Reward/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(400);
  });
  it('it should be able to get a reward ', async () => {
    await request
      .get(`/${version}/Reward/${reward._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to get a reward with invalid id ', async () => {
    await request
      .get(`/${version}/Reward/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
  it('it should be able to get all rewards ', async () => {
    await request
      .get(`/${version}/Reward/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should be able to edit a reward', async () => {
    await request
      .put(`/${version}/Reward/${reward._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ title: 'Tier - 2' })
      .expect(200);
  });
  it('it should be able to delete a reward', async () => {
    await request
      .delete(`/${version}/Reward/${reward._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to delete a reward with invalid id', async () => {
    await request
      .delete(`/${version}/Reward/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
});
