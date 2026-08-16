import paramiko, sys, time, os, io, tarfile
sys.stdout.reconfigure(encoding="utf-8")

REMOTE_FRONTEND    = "/home/u892283443/frontend"
REMOTE_PUBLIC_HTML = "/home/u892283443/domains/darkslategrey-chough-173926.hostingersite.com/public_html"
REMOTE_IMAGES      = REMOTE_PUBLIC_HTML + "/images"
LOCAL_PUBLIC_IMAGES = r"D:\BOUTIIQUE VASTRAA\public\images"

def new_ssh():
    s = paramiko.SSHClient()
    s.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    s.connect("145.79.58.122", port=65002, username="u892283443", password="Jrs@45@jrs",
              timeout=60, banner_timeout=60)
    return s

def upload_dir_tar(sftp, ssh, local_dir, remote_parent, subdir_name):
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        tar.add(local_dir, arcname=subdir_name)
    buf.seek(0)
    remote_tar = f"{remote_parent}/{subdir_name}.tar.gz"
    print(f"  Uploading {subdir_name}.tar.gz ({buf.getbuffer().nbytes // 1024} KB)...")
    sftp.putfo(buf, remote_tar)
    stdin, stdout, stderr = ssh.exec_command(
        f"cd {remote_parent} && tar -xzf {subdir_name}.tar.gz && rm {subdir_name}.tar.gz"
    )
    exit_code = stdout.channel.recv_exit_status()
    print(f"  Extracted {subdir_name}/ (exit: {exit_code})")

# ─── 1. Upload static images (reconnect fresh) ────────────────────────────
print("Connecting for images upload...")
ssh = new_ssh()
sftp = ssh.open_sftp()
print("Uploading static images/...")
upload_dir_tar(sftp, ssh, LOCAL_PUBLIC_IMAGES, REMOTE_PUBLIC_HTML, "images")
sftp.close()
ssh.close()
print("  Done, connection closed.")
time.sleep(2)

# ─── 2. Upload _next/static/ (reconnect fresh) ────────────────────────────
print("Connecting for static chunks upload...")
ssh = new_ssh()
sftp = ssh.open_sftp()
print("Uploading _next/static/...")
sftp.put(r"D:\BOUTIIQUE VASTRAA\next_static.tar.gz", REMOTE_PUBLIC_HTML + "/static.tar.gz")
stdin, stdout, stderr = ssh.exec_command(
    "mkdir -p " + REMOTE_PUBLIC_HTML + "/_next && "
    "cd " + REMOTE_PUBLIC_HTML + "/_next && "
    "tar -xzf ../static.tar.gz && rm ../static.tar.gz"
)
exit_code = stdout.channel.recv_exit_status()
print(f"  Extracted (exit: {exit_code})")
sftp.close()
ssh.close()
time.sleep(2)

# ─── 3. Upload server files + ensure dirs + restart (reconnect fresh) ──────
print("Connecting for server restart...")
ssh = new_ssh()
sftp = ssh.open_sftp()

print("Uploading server.js & package.json...")
sftp.put(r"D:\BOUTIIQUE VASTRAA\.next\standalone\server.js",  REMOTE_FRONTEND + "/server.js")
sftp.put(r"D:\BOUTIIQUE VASTRAA\.next\standalone\package.json", REMOTE_FRONTEND + "/package.json")
sftp.close()
print("  Done")

print("Ensuring uploads directory exists...")
stdin, stdout, stderr = ssh.exec_command(
    f"mkdir -p {REMOTE_IMAGES}/uploads && chmod 755 {REMOTE_IMAGES}/uploads"
)
stdout.channel.recv_exit_status()
print("  Done")

print("Restarting server...")
ssh.exec_command("pkill -f next-server 2>/dev/null")
time.sleep(2)
node = "/opt/alt/alt-nodejs20/root/usr/bin/node"
cmd = (
    "cd " + REMOTE_FRONTEND + " && "
    "nohup env HOST=127.0.0.1 PORT=3099 "
    "UPLOAD_DIR=" + REMOTE_IMAGES + " "
    + node + " server.js > server.log 2>&1 &"
)
ssh.exec_command(cmd)
time.sleep(4)
stdin, stdout, stderr = ssh.exec_command("ps aux | grep next-server | grep -v grep")
out = stdout.read().decode()
if "next-server" in out:
    print("  Server running!")
else:
    print("  Server NOT running — checking log:")
    stdin, stdout, stderr = ssh.exec_command("tail -20 " + REMOTE_FRONTEND + "/server.log")
    print(stdout.read().decode()[-800:])

ssh.close()
print("Deploy complete.")
