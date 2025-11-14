import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    throw new Error('Problème lors de l\'envoi de l\'email');
  }
};

export default sendEmail;
