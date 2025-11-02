import { websiteConfig } from '@/config/website';
import { getTemplate } from '@/mail';
import type {
  MailProvider,
  SendEmailResult,
  SendRawEmailParams,
  SendTemplateParams,
} from '@/mail/types';
import { Resend } from 'resend';

const FALLBACK_FROM_EMAIL =
  process.env.RESEND_FALLBACK_FROM_EMAIL ?? 'ViLearning <noreply@resend.dev>';

const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'protonmail.com',
  'aol.com',
  'mail.com',
]);

const allowPublicSender =
  process.env.RESEND_ALLOW_PUBLIC_SENDER === 'true' ||
  process.env.NEXT_PUBLIC_RESEND_ALLOW_PUBLIC_SENDER === 'true';

function extractEmailAddress(input: string | undefined): string | undefined {
  if (!input) {
    return undefined;
  }
  const match = input.match(/<([^>]+)>/);
  return (match ? match[1] : input).trim();
}

function needsFallback(fromEmail: string | undefined): boolean {
  if (!fromEmail) {
    return true;
  }
  if (allowPublicSender) {
    return false;
  }
  const email = extractEmailAddress(fromEmail);
  if (!email) {
    return true;
  }
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return true;
  }
  return PUBLIC_EMAIL_DOMAINS.has(domain);
}

/**
 * Resend mail provider implementation
 *
 * docs:
 * https://mksaas.com/docs/email
 */
export class ResendProvider implements MailProvider {
  private resend: Resend;
  private from: string;

  /**
   * Initialize Resend provider with API key
   */
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set.');
    }

    const apiKey = process.env.RESEND_API_KEY;
    this.resend = new Resend(apiKey);

    const configuredFrom =
      process.env.RESEND_FROM_EMAIL ??
      process.env.NEXT_PUBLIC_MAIL_FROM ??
      websiteConfig.mail.fromEmail;

    if (needsFallback(configuredFrom)) {
      console.warn(
        `ResendProvider: 发件地址“${configuredFrom ?? '未配置'}”属于公共邮件域，已自动回退至 ${FALLBACK_FROM_EMAIL}。` +
          ' 若要在生产环境使用自定义域名，请在 Resend 验证域名后设置 RESEND_FROM_EMAIL。'
      );
      this.from = FALLBACK_FROM_EMAIL;
    } else {
      this.from = configuredFrom!;
    }
  }

  /**
   * Get the provider name
   * @returns Provider name
   */
  public getProviderName(): string {
    return 'resend';
  }

  /**
   * Send an email using a template
   * @param params Parameters for sending a templated email
   * @returns Send result
   */
  public async sendTemplate(
    params: SendTemplateParams
  ): Promise<SendEmailResult> {
    const { to, template, context, locale } = params;

    try {
      // Get rendered template
      const mailTemplate = await getTemplate({
        template,
        context,
        locale,
      });

      // Send using raw email
      return this.sendRawEmail({
        to,
        subject: mailTemplate.subject,
        html: mailTemplate.html,
        text: mailTemplate.text,
      });
    } catch (error) {
      console.error('Error sending template email:', error);
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Send a raw email
   * @param params Parameters for sending a raw email
   * @returns Send result
   */
  public async sendRawEmail(
    params: SendRawEmailParams
  ): Promise<SendEmailResult> {
    const { to, subject, html, text } = params;

    if (!this.from || !to || !subject || !html) {
      console.warn('Missing required fields for email send', {
        from: this.from,
        to,
        subject,
        html,
      });
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.error('Error sending email', error);
        return {
          success: false,
          error,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error,
      };
    }
  }
}
