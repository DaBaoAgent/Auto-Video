"""send_film_mail.py — 把成片作为附件发到宝哥 QQ 邮箱（smtp.qq.com SSL）。

凭据走环境变量，不落盘：
  QQ_SMTP_SENDER      发件账号（默认 1361098634@qq.com）
  QQ_SMTP_AUTH_CODE   QQ 邮箱授权码（必填）
  QQ_SMTP_TO          收件地址（默认 120112121@qq.com）

用法：
  QQ_SMTP_AUTH_CODE=xxx python send_film_mail.py --subject "..." --body-file body.txt --attach a.mp4
"""
import argparse
import mimetypes
import os
import smtplib
import sys
from email.header import Header
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

ap = argparse.ArgumentParser()
ap.add_argument('--subject', required=True)
ap.add_argument('--body-file', required=True)
ap.add_argument('--attach', action='append', default=[])
a = ap.parse_args()

host = os.environ.get('QQ_SMTP_HOST', 'smtp.qq.com')
port = int(os.environ.get('QQ_SMTP_PORT', '465'))
sender = os.environ.get('QQ_SMTP_SENDER', '1361098634@qq.com')
code = os.environ.get('QQ_SMTP_AUTH_CODE', '')
to = os.environ.get('QQ_SMTP_TO', '120112121@qq.com')
if not code:
    sys.exit('缺少 QQ_SMTP_AUTH_CODE')

body = open(a.body_file, encoding='utf-8').read()
msg = MIMEMultipart()
msg['Subject'] = Header(a.subject, 'utf-8')
msg['From'] = formataddr((str(Header('伊甸园成片', 'utf-8')), sender))
msg['To'] = to
msg.attach(MIMEText(body, 'plain', 'utf-8'))

for path in a.attach:
    size = os.path.getsize(path)
    if size > 50 * 1024 * 1024:
        sys.exit('附件 %.1f MB 超过 QQ 邮箱 50 MB 限制：%s' % (size / 1048576, path))
    ctype, _ = mimetypes.guess_type(path)
    maintype, subtype = (ctype or 'application/octet-stream').split('/', 1)
    part = MIMEApplication(open(path, 'rb').read(), _subtype=subtype)
    part.add_header('Content-Disposition', 'attachment',
                    filename=('utf-8', '', os.path.basename(path)))
    msg.attach(part)
    print('attach %s (%.1f MB)' % (os.path.basename(path), size / 1048576))

with smtplib.SMTP_SSL(host, port, timeout=120) as srv:
    srv.login(sender, code)
    srv.sendmail(sender, [x.strip() for x in to.split(',')], msg.as_string())
print('已发送 → %s（%s）' % (to, a.subject))
