import paramiko, sys, time, os, io, tarfile
sys.stdout.reconfigure(encoding="utf-8")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("145.79.58.122", port=65002, username="u892283443", password="Jrs@45@jrs")
sftp = ssh.open_sftp()

REMOTE_FRONTEND    = "/home/u892283443/frontend"
REMOTE_PUBLIC_HTML = "/home/u892283443/domains/darkslategrey-chough-173926.hostingersite.com/public_html"
REMOTE_IMAGES      = REMOTE_PUBLIC_HTML + "/images"   # Apache serves /images/* from here
LOCAL_PUBLIC_IMAGES = r"D:\BOUTIIQUE VASTRAA\public\images"

# ─── Helper: upload a whole directory tree via tar ─────────────────────────
def upload_dir_tar(local_dir, remote_parent, subdir_name):
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        tar.add(local_dir, arcname=subdir_name)
    buf.seek(0)
    remote_tar = f"{remote_parent}/{subdir_name}.tar.gz"
    sftp.putfo(buf, remote_tar)
    stdin, stdout, stderr = ssh.exec_command(
        f"cd {remote_parent} && tar -xzf {subdir_name}.tar.gz && rm {subdir_name}.tar.gz"
    )
    exit_code = stdout.channel.recv_exit_status()
    print(f"  Uploaded {subdir_name}/ (exit: {exit_code})")

# ─── 1. Standalone .next/ ──────────────────────────────────────────────────
print("Uploading standalone .next/...")
sftp.put(r"D:\BOUTIIQUE VASTRAA\standalone_dotnext.tar.gz", REMOTE_FRONTEND + "/dotnext.tar.gz")
stdin, stdout, stderr = ssh.exec_command("cd " + REMOTE_FRONTEND + " && tar -xzf dotnext.tar.gz && rm dotnext.tar.gz")
exit_code = stdout.channel.recv_exit_status()
print(f"  Extracted (exit: {exit_code})")

# ─── 2. data/ — SKIP: live data lives in MySQL on Hostinger ────────────────
#
# DO NOT upload data/ during deployment.
# All live data (products, orders, collections, settings, users, coupons,
# reviews, qna) is stored in MySQL (ENABLE_DATABASE=true on the server).
# Uploading local data/ would OVERWRITE the live database's JSON fallback
# and reset the site to defaults on every deploy.
#
# If this is a FRESH first deploy to an empty database, uncomment the
# two lines below ONCE, then comment them out again for future deploys:
#
# LOCAL_DATA = r"D:\BOUTIIQUE VASTRAA\data"
# upload_dir_tar(LOCAL_DATA, REMOTE_FRONTEND, "data")

# ─── 3. public/images/ (static assets served by Apache from public_html) ───
#
# Only uploads local images (logo, loader, etc). Does NOT delete server images.
# Admin-uploaded images are saved directly to REMOTE_IMAGES by the server,
# so they are never overwritten here.
print("Uploading static images/...")
upload_dir_tar(LOCAL_PUBLIC_IMAGES, REMOTE_PUBLIC_HTML, "images")

# ─── 4. _next/static/ ──────────────────────────────────────────────────────
print("Uploading _next/static/...")
sftp.put(r"D:\BOUTIIQUE VASTRAA\next_static.tar.gz", REMOTE_PUBLIC_HTML + "/static.tar.gz")
stdin, stdout, stderr = ssh.exec_command(
    "mkdir -p " + REMOTE_PUBLIC_HTML + "/_next && "
    "cd " + REMOTE_PUBLIC_HTML + "/_next && "
    "tar -xzf ../static.tar.gz && rm ../static.tar.gz"
)
exit_code = stdout.channel.recv_exit_status()
print(f"  Extracted (exit: {exit_code})")

# ─── 5. server.js & package.json ───────────────────────────────────────────
print("Uploading server files...")
sftp.put(r"D:\BOUTIIQUE VASTRAA\.next\standalone\server.js", REMOTE_FRONTEND + "/server.js")
sftp.put(r"D:\BOUTIIQUE VASTRAA\.next\standalone\package.json", REMOTE_FRONTEND + "/package.json")
print("  Done")

sftp.close()

# ─── 6. Ensure uploads dir exists & is writable in public_html/images ──────
print("Ensuring uploads directory exists...")
stdin, stdout, stderr = ssh.exec_command(
    f"mkdir -p {REMOTE_IMAGES}/uploads && chmod 755 {REMOTE_IMAGES}/uploads"
)
stdout.channel.recv_exit_status()
print("  Done")

# ─── 7. Restart server ─────────────────────────────────────────────────────
print("Restarting server...")
ssh.exec_command("pkill -f next-server 2>/dev/null")
time.sleep(1)
node = "/opt/alt/alt-nodejs20/root/usr/bin/node"
# UPLOAD_DIR tells Next.js where to write uploaded images.
# It must match where Apache serves /images/* (i.e. public_html/images).
cmd = (
    "cd " + REMOTE_FRONTEND + " && "
    "nohup env HOST=127.0.0.1 PORT=3099 "
    "UPLOAD_DIR=" + REMOTE_IMAGES + " "
    + node + " server.js > server.log 2>&1 &"
)
ssh.exec_command(cmd)
time.sleep(3)
stdin, stdout, stderr = ssh.exec_command("ps aux | grep next-server | grep -v grep")
out = stdout.read().decode()
if "next-server" in out:
    print("  Server running!")
else:
    print("  Server NOT running")
    stdin, stdout, stderr = ssh.exec_command("tail -30 " + REMOTE_FRONTEND + "/server.log")
    print("Log:", stdout.read().decode()[-500:])

ssh.close()
print("Deploy complete.")
