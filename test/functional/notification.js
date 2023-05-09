const config = require('config');
const version = config.get('version');
const data = {
  notificationData: {
    notification: {
      title: 'Hi {{name}}',
      body: 'Hi {{name}} {{phone}} {{email}}'
    },
    data: {
      anyparam: '2232'
    }
  }
};
const data1 = {};
let token;
let category;
describe('NOTIFICATION', () => {
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

  it('it should be able to get all notifications ', async () => {
    await request
      .get(`/${version}/Notification/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });

  it('it should not be able to send notification without notification data', async () => {
    await request
      .post(`/${version}/Notification/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data1)
      .expect(422);
  });

  it('it should be able to send notification', async () => {
    await request
      .post(`/${version}/Notification/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
  });
});
