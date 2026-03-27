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
      from: '"FinPlan App" <no-reply@finplan.test>',
      to,
      subject: 'Bem-vindo(a) ao FinPlan! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6366f1;">Olá, ${name}!</h2>
          <p>Sua conta no <strong>FinPlan</strong> foi criada com sucesso.</p>
          <p>Estamos muito felizes em ter você conosco. Agora você pode controlar suas finanças, definir metas e planejar seu futuro usando nossa Árvore de Planejamento visual.</p>
          <br/>
          <p>Seja bem-vindo(a)!</p>
          <p>Atenciosamente, <br/>Equipe FinPlan</p>
        </div>
      `
    });

    console.log('[Email] Mensagem enviada: %s', info.messageId);
    console.log('[Email] (MOCK) Veja o e-mail que foi "enviado" acessando: %s', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error('[Email] Falha ao enviar e-mail de boas-vindas:', err);
  }
}
