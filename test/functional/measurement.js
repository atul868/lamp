const config = require('config');
const version = config.get('version');
const data = {
  name: 'Kilo Grams',
  slug: 'Kg'
};
let token;
let measurement;
describe('MEASUREMENT', () => {
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
  it('it should be able to create measurement ', async () => {
    const res = await request
      .post(`/${version}/Measurement/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
    measurement = res.body;
  });
  it('it should not be able to create measurement, with same name  ', async () => {
    await request
      .post(`/${version}/Measurement/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(400);
  });
  it('it should be able to get a measurement ', async () => {
    await request
      .get(`/${version}/Measurement/${measurement._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to get a measurement with invalid id ', async () => {
    await request
      .get(`/${version}/Measurement/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
  it('it should be able to get all measurements ', async () => {
    await request
      .get(`/${version}/Measurement/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should be able to edit a measurement', async () => {
    await request
      .put(`/${version}/Measurement/${measurement._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ name: 'KGS' })
      .expect(200);
  });
  it('it should be able to delete a measurement', async () => {
    await request
      .delete(`/${version}/Measurement/${measurement._id}`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('it should not be able to delete a measurement with invalid id', async () => {
    await request
      .delete(`/${version}/Measurement/5d713a66ec8f2b88b8f830b8`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(400);
  });
});
