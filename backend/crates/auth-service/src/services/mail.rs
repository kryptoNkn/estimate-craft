//! Отправка писем: SMTP в проде, лог в development, inbox в тестах.
//! Токен сброса в production не логируем.

use std::sync::{Arc, Mutex};

use lettre::{
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
    message::Mailbox,
    transport::smtp::{authentication::Credentials, client::Tls},
};

use crate::{config::SmtpSettings, error::AppError};

#[derive(Clone, Debug)]
pub struct OutboundEmail {
    pub to: String,
    pub subject: String,
    pub body: String,
}

#[derive(Clone)]
pub struct Mailer {
    inner: MailerInner,
}

#[derive(Clone)]
enum MailerInner {
    Log,
    Capture(Arc<Mutex<Vec<OutboundEmail>>>),
    Smtp {
        transport: AsyncSmtpTransport<Tokio1Executor>,
        from: Mailbox,
    },
}

#[derive(Clone, Default)]
pub struct CapturedMail(Arc<Mutex<Vec<OutboundEmail>>>);

impl CapturedMail {
    pub fn last(&self) -> Option<OutboundEmail> {
        self.0.lock().ok().and_then(|inbox| inbox.last().cloned())
    }
}

impl Mailer {
    pub fn log() -> Self {
        Self {
            inner: MailerInner::Log,
        }
    }

    pub fn capturing() -> (Self, CapturedMail) {
        let inbox = CapturedMail::default();
        (
            Self {
                inner: MailerInner::Capture(inbox.0.clone()),
            },
            inbox,
        )
    }

    pub fn from_settings(settings: &SmtpSettings) -> Result<Self, String> {
        let Some(host) = settings.host.as_deref() else {
            if settings.required {
                return Err("SMTP_HOST is required in production".into());
            }
            return Ok(Self::log());
        };

        let from = settings
            .from
            .as_deref()
            .ok_or_else(|| "SMTP_FROM is required when SMTP_HOST is set".to_string())?
            .parse::<Mailbox>()
            .map_err(|_| "SMTP_FROM must be a valid mailbox (Name <email@domain>)".to_string())?;

        let mut builder = match settings.tls.as_str() {
            "tls" => AsyncSmtpTransport::<Tokio1Executor>::relay(host)
                .map_err(|err| format!("SMTP relay: {err}"))?
                .port(settings.port),
            "none" => AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(host)
                .port(settings.port)
                .tls(Tls::None),
            _ => AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)
                .map_err(|err| format!("SMTP STARTTLS: {err}"))?
                .port(settings.port),
        };

        if let (Some(username), Some(password)) =
            (settings.username.as_ref(), settings.password.as_ref())
        {
            builder = builder.credentials(Credentials::new(username.clone(), password.clone()));
        }

        Ok(Self {
            inner: MailerInner::Smtp {
                transport: builder.build(),
                from,
            },
        })
    }

    pub async fn send_password_reset(
        &self,
        to_email: &str,
        reset_url: &str,
    ) -> Result<(), AppError> {
        let subject = "Сброс пароля";
        let body = format!(
            "Чтобы задать новый пароль, откройте ссылку (она действует ограниченное время):\n\n{reset_url}\n\nЕсли вы не запрашивали сброс, проигнорируйте это письмо.\n"
        );

        match &self.inner {
            MailerInner::Log => {
                tracing::info!(to = to_email, "dev password reset link: {reset_url}");
                Ok(())
            }
            MailerInner::Capture(inbox) => {
                if let Ok(mut guard) = inbox.lock() {
                    guard.push(OutboundEmail {
                        to: to_email.to_string(),
                        subject: subject.to_string(),
                        body,
                    });
                }
                Ok(())
            }
            MailerInner::Smtp { transport, from } => {
                let to = to_email.parse::<Mailbox>().map_err(|_| AppError::Internal)?;
                let message = Message::builder()
                    .from(from.clone())
                    .to(to)
                    .subject(subject)
                    .body(body)
                    .map_err(|_| {
                        tracing::error!("failed to build password reset email");
                        AppError::Internal
                    })?;

                transport.send(message).await.map_err(|err| {
                    tracing::error!(to = to_email, error = %err, "failed to send password reset email");
                    AppError::Internal
                })?;

                Ok(())
            }
        }
    }
}
