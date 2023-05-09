const nodemailer = require('nodemailer');
const config = require('config');
const path = require('path');
const uid = require('uid2');
const { EmailTemplate } = require('email-templates');

const otpLength = 32;

const transporter = nodemailer.createTransport({
  host: config.get('emailConfig').host,
  port: config.get('emailConfig').port,
  auth: {
    user: config.get('emailConfig').user,
    pass: config.get('emailConfig').pass
  },
  tls: { rejectUnauthorized: false }
});

module.exports = {
  sendForgotPasswordMail: async member => {
    const templateDir = path.join(__dirname, '../', 'templates', 'forgotPassword');
    try {
      member.token = uid(otpLength);
      await member.save();
    } catch (error) {
      return console.log(error);
    }
    const forgotPassword = new EmailTemplate(templateDir);
    const link = `${config.get('webLink')}/Set-Password/${member.token}/${member.id}`;
    const data = {
      name: member.name,
      link
    };
    if (config.get('isTesting')) return;
    forgotPassword.render(data, 'en', (error, result) => {
      if (error) return console.log(error);
      const mailOptions = {
        from: config.get('emailConfig').sender,
        to: member.email,
        subject: 'Forgot Password',
        html: result.html
      };
      transporter.sendMail(mailOptions, (error, res) => {
        if (error) {
          return console.log(error);
        }
        return console.log(res);
      });
    });
  },
  changePasswordEmail: async member => {
    const templateDir = path.join(__dirname, '../', 'templates', 'passwordChange');
    const changePassword = new EmailTemplate(templateDir);
    const data = { name: member.name };

    changePassword.render(data, 'en', (error, result) => {
      if (error) return console.log(error);
      const mailOptions = {
        from: config.get('emailConfig').sender,
        to: member.email,
        subject: 'Change Password',
        html: result.html
      };
      if (config.get('isTesting')) return;
      transporter.sendMail(mailOptions, (error, res) => {
        if (error) {
          return console.log(error);
        }
        return console.log(res);
      });
    });
  },
  sendVerifyMail: member =>
    new Promise(async (resolve, reject) => {
      console.log(`sending verify mail to ${member.email}`);
      try {
        member.token = uid(otpLength);
        await member.save();
      } catch (error) {
        return reject(error);
      }
      const name = member.name;;
      const templateDir = path.join(__dirname, '../', 'templates', 'verifyEmail');
      const verifyEmailTemplate = new EmailTemplate(templateDir);
      const link = `${config.get('webLink')}/Verify-Email/${member.token}/${member.id}`;
      verifyEmailTemplate.render(
        {
          name,
          link
        },
        'en',
        (error, result) => {
          if (error) return console.log(error);
          const options = {
            to: member.email,
            from: config.get('emailConfig').sender,
            subject: 'Email Verification',
            html: result.html
          };
          if (config.get('isTesting')) return;
          try {
            transporter.sendMail(options, (error, res) => {
              if (error) {
                return reject(error);
              }
              console.log(res);
              resolve();
            });
          } catch (error) {
            return reject(error);
          }
        }
      );
    })
};
