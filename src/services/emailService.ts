
'use server';

import nodemailer from 'nodemailer';

// This service is set up to use Ethereal, a fake SMTP service for development.
// In a real production environment, you would replace this configuration with your actual email provider's settings (e.g., SendGrid, AWS SES, Gmail).

let transporter: nodemailer.Transporter;

async function getTransporter() {
    if (transporter) {
        return transporter;
    }

    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    console.log("****************************************************");
    console.log("📧 Ethereal test account created for email sending.");
    console.log(`📧 User: ${testAccount.user}`);
    console.log(`📧 Pass: ${testAccount.pass}`);
    console.log("📧 Use these credentials if Nodemailer asks for them.");
    console.log("****************************************************");

    // Create a transporter object using the Ethereal transport
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    return transporter;
}

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text: string;
}

export async function sendEmail(options: EmailOptions) {
    const mailer = await getTransporter();

    const info = await mailer.sendMail({
        from: '"Qoro" <no-reply@qoro.com.br>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    });

    console.log("✅ Message sent: %s", info.messageId);
    // Preview URL will be logged to the console
    console.log("✅ Preview URL: %s", nodemailer.getTestMessageUrl(info));

    return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
}

export async function sendInviteEmail(toEmail: string, organizationName: string, inviteLink: string) {
    const subject = `Você foi convidado para a organização ${organizationName} na Qoro`;

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h1 style="color: #5a29e4; font-size: 24px;">Convite para a Qoro</h1>
            <p>Olá,</p>
            <p>Você foi convidado por um administrador para se juntar à organização <strong>${organizationName}</strong> na plataforma Qoro.</p>
            <p>Para começar, clique no botão abaixo para configurar sua senha e acessar a plataforma:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #9D4EDD; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Configurar Minha Conta</a>
            </p>
            <p>Se o botão não funcionar, copie e cole o seguinte link no seu navegador:</p>
            <p style="word-break: break-all; font-size: 12px; color: #777;">${inviteLink}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Este é um e-mail automático, por favor, não responda.</p>
        </div>
    `;

    const text = `
        Olá,
        Você foi convidado por um administrador para se juntar à organização ${organizationName} na plataforma Qoro.
        Para começar, acesse o seguinte link para configurar sua senha e acessar a plataforma:
        ${inviteLink}
    `;

    return sendEmail({ to: toEmail, subject, html, text });
}
