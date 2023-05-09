const config = require('config');
const version = config.get('version');
const data = {
  title: 'Its was great',
  message: 'It Is Great'
};
let token;
let feedback;
describe('Feedback', () => {
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
  it('it should be able to create feedback ', async () => {
    const res = await request
      .post(`/${version}/Feedback/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
    feedback = res.body;
  });
  it('it should be able to get a feedback ', async () => {
    await request
      .get(`/${version}/Feedback/${feedback._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to get a feedback with invalid id ', async () => {
    await request
      .get(`/${version}/Feedback/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
  it('it should be able to get all feedbacks ', async () => {
    await request
      .get(`/${version}/Feedback/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should be able to edit a feedback', async () => {
    await request
      .put(`/${version}/Feedback/${feedback._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ title: 'Tier - 2' })
      .expect(200);
  });
  it('it should be able to delete a feedback', async () => {
    await request
      .delete(`/${version}/Feedback/${feedback._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to delete a feedback with invalid id', async () => {
    await request
      .delete(`/${version}/Feedback/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
});
