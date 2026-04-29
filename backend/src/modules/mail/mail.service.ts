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
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Redefinição de senha</title>
      </head>
      <body style="margin:0;background:#f8fafc;padding:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1e293b">
        <div style="display:none;max-height:0;overflow:hidden;color:transparent">
          Use este link para redefinir sua senha na Auri. Ele expira em 1 hora.
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:448px">
                <tr>
                  <td align="center" style="padding:0 0 30px">
                    <div style="display:inline-block;text-align:center">
                      <div style="height:1px;width:42px;margin:0 auto 3px;background:#ffba1a;line-height:1px;font-size:1px">&nbsp;</div>
                      <div style="font-family:Cinzel,Georgia,'Times New Roman',serif;font-size:24px;line-height:1;color:#ffba1a;font-weight:700;letter-spacing:.02em">
                        AURI
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:left">
                    <h1 style="margin:0;color:#1e293b;font-family:Cinzel,Merriweather,Georgia,serif;font-size:30px;line-height:1.2;font-weight:700">
                      Redefina sua senha
                    </h1>
                    <p style="margin:8px 0 0;color:#64748b;font-size:16px;line-height:1.55">
                      Escolha uma nova senha para continuar acessando sua conta.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:32px">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 1px 2px rgba(15,23,42,.05)">
                      <tr>
                        <td style="padding:24px">
                          <p style="margin:0;color:#475569;font-size:15px;line-height:1.7">
                            Olá, ${this.escapeHtml(name)}. Recebemos uma solicitação para redefinir sua senha na Auri.
                          </p>
                          <p style="margin:14px 0 0;color:#475569;font-size:15px;line-height:1.7">
                            Clique no botão abaixo para criar uma nova senha. O link fica disponível por 1 hora.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px">
                    <a href="${resetUrl}" style="display:block;width:100%;box-sizing:border-box;background:#1e293b;color:#ffffff;text-align:center;text-decoration:none;border-radius:8px;padding:13px 18px;font-size:14px;font-weight:700;letter-spacing:.025em">
                      REDEFINIR SENHA
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:18px">
                    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">
                      Se você não solicitou essa alteração, ignore este e-mail.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:18px">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;line-height:1.6">
                      Se o botão não funcionar, copie e cole este link no navegador:
                    </p>
                    <a href="${resetUrl}" style="color:#3a536f;font-size:12px;line-height:1.6;word-break:break-all;text-decoration:underline">
                      ${resetUrl}
                    </a>
                  </td>
                </tr>
                <tr>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
