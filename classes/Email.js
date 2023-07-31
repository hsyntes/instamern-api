const nodemailer = require("nodemailer");
const AWS = require("../aws-config");
const pug = require("pug");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstname = user.firstname;
    this.url = url;
  }

  // * Creating transport
  createTransport() {
    if (process.env.NODE_ENV === "production") {
      const ses = new AWS.SES();
      return nodemailer.createTransport({ SES: { ses, aws: AWS } });
    }

    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
  }

  // * Private send method
  async #send(subject, text) {
    const html = pug.renderFile(`${__dirname}/../views/email.pug`, {
      subject,
      firstname: this.firstname,
      text,
      url: this.url,
    });

    await this.createTransport().sendMail({
      from: `Huseyin Ates <${process.env.EMAIL_FROM}>`,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    });
  }

  // * Sending emails for different scenerios
  async sendWelcome() {
    await this.#send("Wellcome to InstaMERN", "We're glad to have you! 🥳");
  }

  async sendResetPassword() {
    await this.#send(
      "Reset your password",
      "We received a request to reset your password for your InstaMERN account. To proceed with the password reset, please click on the link below."
    );
  }
};
