#!/usr/bin/env python3
"""从 Chrome 的 Cookies 库解出 bilibili 的 cookie，写成 Netscape 格式。

背景：yt-dlp --cookies-from-browser chrome 在这台机器上只能解出一小部分 cookie
（296/3765），SESSDATA 正好在解不开的那批里，导致每小时的自动扫描连续失败。
这个脚本直接走 macOS 的 Chrome Safe Storage 密钥自己解，绕开 yt-dlp。
"""
import hashlib
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import os

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

CHROME_DB = os.path.expanduser(
    '~/Library/Application Support/Google/Chrome/Default/Cookies')
DOMAINS = ('bilibili.com', 'bilibili.cn', 'biligame.com', 'bilivideo.com')


def safe_storage_key():
    r = subprocess.run(['security', 'find-generic-password', '-w',
                        '-s', 'Chrome Safe Storage'],
                       capture_output=True, text=True, timeout=90)
    if r.returncode != 0:
        sys.exit(f'读钥匙串失败: {r.stderr.strip()}')
    return r.stdout.strip().encode()


def decrypt(enc, key, host_key):
    """Chrome macOS v10：PBKDF2(salt=saltysalt, 1003 轮) + AES-128-CBC，IV 是 16 个空格。

    Chrome 124 起明文前面多了 32 字节的 host_key SHA256，用来防 cookie 串域，
    对得上就剥掉，对不上说明是老格式，原样返回。
    """
    if not enc.startswith(b'v10'):
        return enc.decode('utf-8', 'replace')
    derived = hashlib.pbkdf2_hmac('sha1', key, b'saltysalt', 1003, 16)
    dec = Cipher(algorithms.AES(derived), modes.CBC(b' ' * 16)).decryptor()
    plain = dec.update(enc[3:]) + dec.finalize()
    if plain:
        pad = plain[-1]
        if 1 <= pad <= 16:
            plain = plain[:-pad]
    if len(plain) > 32 and plain[:32] == hashlib.sha256(host_key.encode()).digest():
        plain = plain[32:]
    return plain.decode('utf-8', 'replace')


def main(dest):
    key = safe_storage_key()
    tmp = os.path.join(tempfile.gettempdir(), 'chrome_cookies_copy.db')
    shutil.copy2(CHROME_DB, tmp)          # Chrome 开着时原库是锁的，必须先拷贝
    con = sqlite3.connect(tmp)
    rows = con.execute(
        'select host_key, name, value, encrypted_value, path, is_secure, expires_utc '
        'from cookies').fetchall()
    con.close()

    lines, kept, sess = [], 0, False
    for host, name, val, enc, path, secure, exp in rows:
        if not any(d in host for d in DOMAINS):
            continue
        v = val or (decrypt(enc, key, host) if enc else '')
        if not v:
            continue
        # Chrome 存的是 1601 纪元的微秒，Netscape 要 Unix 秒
        expiry = max(0, exp // 1000000 - 11644473600) if exp else 0
        lines.append('\t'.join([
            host, 'TRUE' if host.startswith('.') else 'FALSE', path or '/',
            'TRUE' if secure else 'FALSE', str(expiry), name, v]))
        kept += 1
        if name == 'SESSDATA' and 'bilibili.com' in host:
            sess = True

    with open(dest, 'w') as f:
        f.write('# Netscape HTTP Cookie File\n')
        f.write('\n'.join(lines) + '\n')
    os.chmod(dest, 0o600)
    os.remove(tmp)
    print(f'写出 {kept} 条 cookie -> {dest}')
    print('bilibili.com 的 SESSDATA:', '有' if sess else '没有')
    return 0 if sess else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
