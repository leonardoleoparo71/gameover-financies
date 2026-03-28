import { Resend } from 'resend';

// A chave de API deve estar no arquivo .env como RESEND_API_KEY
// Se não houver chave, usamos um mock para não quebrar o fluxo de dev
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY não configurada. Simulando envio de Welcome Email.');
    return;
  }

  try {
    await resend.emails.send({
      from: 'GameOver <onboarding@resend.dev>', // Use um domínio verificado em produção
      to,
      subject: 'Bem-vindo(a) ao GameOver! 🎮🔨',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #020408; color: #f1f3f9; padding: 40px; border-radius: 20px; border: 1px solid #1f2937;">
          <h2 style="color: #6366f1; text-align: center; font-size: 24px;">Olá, ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #9ca3af;">Sua conta no <strong style="color: #6366f1;">GameOver</strong> foi criada com sucesso.</p>
          <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #9ca3af;">A era do planejamento financeiro épico começou. Agora você tem o poder do martelo para destruir suas dívidas!</p>
          <div style="text-align: center; margin: 40px 0;">
             <span style="font-size: 64px;">🔨</span>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center;">Seja bem-vindo(a) ao próximo nível!</p>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">Atenciosamente, <br/><strong>Equipe GameOver</strong></p>
        </div>
      `
    });
  } catch (err) {
    console.error('[Email] Falha ao enviar e-mail de boas-vindas:', err);
  }
}

export async function sendResetPasswordEmail(to: string, name: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  if (!resend) {
    console.warn('[Email] RESEND_API_KEY não configurada. Simulando envio de Reset Email.');
    console.log('[Email Mock] Link de reset:', resetUrl);
    return;
  }

  try {
    await resend.emails.send({
      from: 'GameOver <auth@resend.dev>',
      to,
      subject: 'Recuperação de Senha — GameOver 🔐',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #020408; color: #f1f3f9; padding: 40px; border-radius: 20px; border: 1px solid #1f2937;">
          <h2 style="color: #6366f1; text-align: center; font-size: 24px;">Oi, ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; text-align: center;">Recebemos uma solicitação para redefinir a sua senha no GameOver.</p>
          <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; text-align: center;">Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 14px 30px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);">
              Redefinir Senha
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center;">Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">Atenciosamente, <br/><strong>Equipe GameOver</strong></p>
          
          <hr style="border: none; border-top: 1px solid #1f2937; margin: 30px 0;">
          <p style="font-size: 12px; color: #4b5563; text-align: center;">Se o botão não funcionar, copie o link abaixo:<br>${resetUrl}</p>
        </div>
      `
    });
  } catch (err) {
    console.error('[Email] Falha ao enviar e-mail de reset:', err);
  }
}
