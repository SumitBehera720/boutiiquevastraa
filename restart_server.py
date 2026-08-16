import paramiko, sys, time
sys.stdout.reconfigure(encoding="utf-8")

REMOTE_FRONTEND    = "/home/u892283443/frontend"
REMOTE_PUBLIC_HTML = "/home/u892283443/domains/darkslategrey-chough-173926.hostingersite.com/public_html"
REMOTE_IMAGES      = REMOTE_PUBLIC_HTML + "/images"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("145.79.58.122", port=65002, username="u892283443", password="Jrs@45@jrs", timeout=30)

# Ensure uploads dir exists
print("Ensuring uploads dir exists...")
stdin, stdout, stderr = ssh.exec_command(
    f"mkdir -p {REMOTE_IMAGES}/uploads && chmod 755 {REMOTE_IMAGES}/uploads && echo OK"
)
print(" ", stdout.read().decode().strip())

# Kill old server
print("Stopping old server...")
ssh.exec_command("pkill -f next-server 2>/dev/null")
time.sleep(2)

# Start with UPLOAD_DIR
print("Starting server with UPLOAD_DIR...")
node = "/opt/alt/alt-nodejs20/root/usr/bin/node"
cmd = (
    f"cd {REMOTE_FRONTEND} && "
    f"nohup env HOST=127.0.0.1 PORT=3099 UPLOAD_DIR={REMOTE_IMAGES} "
    f"{node} server.js > server.log 2>&1 &"
)
ssh.exec_command(cmd)
time.sleep(4)

# Verify
stdin, stdout, stderr = ssh.exec_command("ps aux | grep next-server | grep -v grep")
out = stdout.read().decode()
if "next-server" in out:
    print("Server running!")
else:
    print("Server NOT running — log tail:")
    stdin, stdout, stderr = ssh.exec_command(f"tail -20 {REMOTE_FRONTEND}/server.log")
    print(stdout.read().decode())

ssh.close()
print("Done.")
