import smtplib
from email.message import EmailMessage
import os

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER", "lifeos@yourdomain.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")

def send_email(to_email: str, subject: str, body: str):
    if not EMAIL_PASSWORD:
        print(f"Skipping email to {to_email}: Missing EMAIL_PASSWORD")
        return
        
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
            print(f"Sent email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
