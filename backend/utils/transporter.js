import dotenv from 'dotenv';
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Vérification de la connexion SMTP
transporter.verify(function (error, success) {
    console.log('Vérification de la connexion SMTP...');
    if (error) {
        console.error('Erreur de connexion SMTP:', error);
        console.log('Configuration utilisée:', {
            host: transporter.options.host,
            port: transporter.options.port,
            secure: transporter.options.secure,
            user: process.env.EMAIL_USER
        });
        console.error('Erreur de configuration du transporteur email:', error);
    } else {
        console.log("Le serveur SMTP est prêt à envoyer des emails");
        console.log('Configuration SMTP:', {
            host: transporter.options.host,
            port: transporter.options.port,
            secure: transporter.options.secure,
            user: process.env.EMAIL_USER
        });
    }
});

export default transporter;