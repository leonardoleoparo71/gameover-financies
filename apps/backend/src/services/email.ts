import { Resend } from 'resend';

// A chave de API deve estar no arquivo .env como RESEND_API_KEY
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'GameOver Segurança <onboarding@resend.dev>';

export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) return console.warn('[Email] RESEND_API_KEY não configurada. Simulando envio de Welcome Email.');

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Bem-vindo(a) ao GameOver! 🎮🔨',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #020408; color: #f1f3f9; padding: 40px; border-radius: 20px; border: 1px solid #1f2937;">
          <div style="text-align: center; margin-bottom: 20px;">
             <span style="font-size: 48px;">🎮</span>
          </div>
          <h2 style="color: #6366f1; text-align: center; font-size: 24px;">Olá, ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #9ca3af;">Sua conta no <strong style="color: #6366f1;">GameOver</strong> foi criada com sucesso.</p>
          <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #9ca3af;">A era do planejamento financeiro épico começou. Agora você tem o poder do martelo para destruir suas dívidas!</p>
          <div style="text-align: center; margin: 40px 0;">
             <span style="font-size: 64px;">🔨</span>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center;">Seja bem-vindo(a) ao próximo nível!</p>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">Atenciosamente, <br/><strong style="color: #6366f1;">Equipe GameOver</strong></p>
        </div>
      `
    });
  } catch (err) { console.error('[Email] Falha ao enviar:', err); }
}

export async function sendResetPasswordEmail(to: string, name: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  if (!resend) return console.log('[Email Mock] Link de reset:', resetUrl);

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Recuperação de Senha — GameOver 🔐',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #020408; color: #f1f3f9; padding: 40px; border-radius: 20px; border: 1px solid #1f2937;">
          <div style="text-align: center; margin-bottom: 20px;">
             <span style="font-size: 48px;">🔐</span>
          </div>
          <h2 style="color: #6366f1; text-align: center; font-size: 24px;">Oi, ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; text-align: center;">Recebemos uma solicitação urgente para redefinir a sua senha no GameOver.</p>
          <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; text-align: center;">Clique no botão abaixo para escolher uma nova senha. Este link expira rapidamente para sua segurança.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 14px 30px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);">
              Redefinir Minha Senha
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center;">Se você não solicitou isso, pule este e-mail. Seus dados estão seguros.</p>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">Atenciosamente, <br/><strong style="color: #6366f1;">Segurança GameOver</strong></p>
        </div>
      `
    });
  } catch (err) { console.error('[Email] Falha ao enviar:', err); }
}

export async function sendLoginAlertEmail(to: string, name: string, userAgent: string, ip: string) {
  if (!resend) return;

  try {
    const timeInfo = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Alerta de Segurança: Novo Acesso 🕵️',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #020408; color: #f1f3f9; padding: 40px; border-radius: 20px; border: 1px solid #1f2937;">
          <div style="text-align: center; margin-bottom: 20px;">
             <span style="font-size: 48px;">🛡️</span>
          </div>
          <h2 style="color: #10b981; text-align: center; font-size: 24px;">Novo acesso detectado</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; text-align: center;">Olá, ${name}. Identificamos um login recente na sua conta GameOver.</p>
          
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin: 30px 0;">
            <p style="margin: 5px 0; color: #9ca3af; font-size: 14px;"><strong>Data/Hora (BRT):</strong> <span style="color: #f3f4f6;">${timeInfo}</span></p>
            <p style="margin: 5px 0; color: #9ca3af; font-size: 14px;"><strong>IP:</strong> <span style="color: #f3f4f6;">${ip || 'Desconhecido'}</span></p>
            <p style="margin: 5px 0; color: #9ca3af; font-size: 14px;"><strong>Dispositivo/Browser:</strong> <span style="color: #f3f4f6;">${userAgent || 'Desconhecido'}</span></p>
          </div>

          <p style="font-size: 14px; color: #f87171; text-align: center; font-weight: 600;">Se não foi você, recomendamos alterar sua senha imediatamente.</p>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">Atenciosamente, <br/><strong style="color: #6366f1;">Segurança GameOver</strong></p>
        </div>
      `
    });
  } catch (err) { console.error('[Email] Falha ao enviar alerta:', err); }
}

export async function sendPasswordChangedEmail(to: string, name: string) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Aviso: Sua senha foi alterada ✅',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #020408; color: #f1f3f9; padding: 40px; border-radius: 20px; border: 1px solid #1f2937;">
          <div style="text-align: center; margin-bottom: 20px;">
             <span style="font-size: 48px;">✅</span>
          </div>
          <h2 style="color: #10b981; text-align: center; font-size: 24px;">Senha Alterada com Sucesso</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; text-align: center;">Olá, ${name}. A senha da sua conta GameOver acabou de ser modificada.</p>
          <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; text-align: center;">Como medida de segurança avançada, <strong>todas as suas outras sessões em navegadores antigos foram automaticamente desconectadas.</strong></p>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 40px;">Se foi você quem fez isso, pode ignorar esta mensagem.</p>
          <p style="font-size: 14px; color: #f87171; text-align: center; margin-top: 10px;">Se NÃO foi você, recupere sua conta usando a opção 'Esqueci Minha Senha' na página de Login.</p>
        </div>
      `
    });
  } catch (err) { console.error('[Email] Falha ao enviar mudança de senha:', err); }
}
