import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);

    if (!host || !user || !pass) {
      throw new Error('Configuração SMTP incompleta: SMTP_HOST, SMTP_USER e SMTP_PASS são obrigatórios.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      tls: {
        servername: this.configService.get<string>('SMTP_TLS_SERVERNAME') ?? host,
      },
      auth: {
        user,
        pass,
      },
    });
  }

  async sendPasswordResetEmail(input: {
    to: string;
    name: string;
    resetUrl: string;
  }) {
    const from = this.configService.get<string>('MAIL_FROM') ?? 'Auri <no-reply@auri.local>';

    await this.transporter.sendMail({
      from,
      to: input.to,
      subject: 'Redefinição de senha - Auri',
      text: this.buildPasswordResetText(input.name, input.resetUrl),
      html: this.buildPasswordResetHtml(input.name, input.resetUrl),
    });

    this.logger.log(`Email de recuperação enviado para ${input.to}`);
  }

  private buildPasswordResetText(name: string, resetUrl: string) {
    return [
      `Olá, ${name}.`,
      '',
      'Recebemos uma solicitação para redefinir sua senha na Auri.',
      'Use o link abaixo para criar uma nova senha:',
      '',
      resetUrl,
      '',
      'Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.',
    ].join('\n');
  }

  private buildPasswordResetHtml(name: string, resetUrl: string) {
    return `
      <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
        <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:0;border-spacing:0">
          <tr>
            <td style="padding:28px 28px 16px">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#1e3a8a">Auri</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;color:#0f172a">Redefina sua senha</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155">Olá, ${this.escapeHtml(name)}.</p>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#334155">
                Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.
              </p>
              <a href="${resetUrl}" style="display:inline-block;border-radius:10px;background:#0f172a;padding:12px 18px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">
                Redefinir senha
              </a>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#64748b">
                Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
