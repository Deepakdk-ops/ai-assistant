from email.message import EmailMessage
import smtplib
import ssl
from app.core.config import settings


def send_email(recipient: str, subject: str, body: str) -> bool:
    if not settings.smtp_host or not settings.smtp_from_email:
        return False
    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        server.ehlo()
        if settings.smtp_starttls:
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)
    return True
