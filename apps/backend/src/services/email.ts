import nodemailer from 'nodemailer';

// Variável para guardar o transporter assim que a conta teste for criada
let transporter: nodemailer.Transporter | null = null;

async function initTransporter() {
  if (transporter) return transporter;
  // Usaremos o Ethereal Email para gerar uma conta SMTP grátis de testes na hora.
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return transporter;
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const t = await initTransporter();
    
    const info = await t.sendMail({
      from: '"GameOver App" <no-reply@gameover.test>',
      to,
      subject: 'Bem-vindo(a) ao GameOver! 🎮🔨',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1117; color: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #6366f1;">
          <h2 style="color: #6366f1; text-align: center;">Olá, ${name}!</h2>
          <p style="font-size: 16px;">Sua conta no <strong style="color: #6366f1;">GameOver</strong> foi criada com sucesso.</p>
          <p style="font-size: 16px;">A era do planejamento financeiro épico começou. Agora você tem o poder do martelo para destruir suas dívidas e construir seu império!</p>
          <div style="text-align: center; margin: 30px 0;">
             <span style="font-size: 50px;">🔨</span>
          </div>
          <p style="font-size: 14px; color: #9ca3af; text-align: center;">Seja bem-vindo(a) ao próximo nível!</p>
          <p style="font-size: 14px; color: #9ca3af; text-align: center;">Atenciosamente, <br/>Equipe GameOver</p>
        </div>
      `
    });

    console.log('[Email] Mensagem enviada: %s', info.messageId);
    console.log('[Email] (MOCK) Veja o e-mail que foi "enviado" acessando: %s', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error('[Email] Falha ao enviar e-mail de boas-vindas:', err);
  }
}
