import nodemailer from 'nodemailer';
import * as htmlToText from 'html-to-text';
import { User } from '../interfaces/models/user';
import { generateResetPasswordEmailTemplate, generateVerifyEmailTemplate } from './emailTemplate';
import ENV_VAR from '../config/envConfig';

export default class Email {
  firstName: string;
  to: string;
  from: string;
  otp: string;

  constructor(user: User, otp: string) {
    this.firstName = user.firstName;
    this.to = user.email;
    this.from = `lisapa8846@dlbazi.com`;
    this.otp = otp;
  }

  newTransport() {
    if (ENV_VAR.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: ENV_VAR.SENDGRID_USERNAME,
          pass: ENV_VAR.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: ENV_VAR.EMAIL_HOST,
      port: Number(ENV_VAR.EMAIL_PORT),
      auth: {
        user: ENV_VAR.EMAIL_USERNAME,
        pass: ENV_VAR.EMAIL_PASSWORD,
      },
    });
  }

  async send(template: string, subject: string) {
    // 1) create mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: template,
      text: htmlToText.convert(template),
    };

    // 2) send mail
    await this.newTransport().sendMail(mailOptions);
  }

  async sendVerificationEmail() {
    await this.send(generateVerifyEmailTemplate(this.otp), 'Welcome To our Chat App!');
  }

  async sendResetPasswordEmail() {
    await this.send(
      generateResetPasswordEmailTemplate(this.otp),
      'Reset Password Token (valid for 10 mins)'
    );
  }
}
