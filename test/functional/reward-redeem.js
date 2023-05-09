const config = require('config');
const version = config.get('version');

describe('Reward-Redeem', () => {
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
  it('it should be able to get all rewards ', async () => {
    await request
      .get(`/${version}/RewardRedeem/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
});
