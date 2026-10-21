import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppConfig } from '../../config/configuration';

/**
 * Thin wrapper around nodemailer.
 * When MAIL_HOST is empty (local development) messages are printed to the console instead of sent.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly logOnly: boolean;

  constructor(config: ConfigService) {
    const mail = config.getOrThrow<AppConfig['mail']>('mail');
    this.from = mail.from;
    this.logOnly = !mail.host;
    this.transporter = this.logOnly
      ? nodemailer.createTransport({ jsonTransport: true })
      : nodemailer.createTransport({
          host: mail.host,
          port: mail.port,
          secure: mail.secure,
          auth: mail.user
            ? { user: mail.user, pass: mail.password }
            : undefined,
        });
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      if (this.logOnly)
        this.logger.log(`[MAIL_HOST not set] Would send "${subject}" to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send "${subject}" to ${to}: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Unable to send mail, please check the mail settings',
      );
    }
  }
}
