import paramiko, sys, time, os, io, tarfile
sys.stdout.reconfigure(encoding="utf-8")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("145.79.58.122", port=65002, username="u892283443", password="Jrs@45@jrs")
sftp = ssh.open_sftp()

REMOTE = "/home/u892283443/frontend"
LOCAL_ARCHIVE = os.path.join(os.environ["TEMP"], "standalone_dotnext.tar.gz")

# ─── 1. Upload standalone bundle ──────────────────────────────────────────
print("Uploading standalone bundle...")
sftp.put(LOCAL_ARCHIVE, REMOTE + "/dotnext.tar.gz")
stdin, stdout, stderr = ssh.exec_command("cd " + REMOTE + " && tar -xzf dotnext.tar.gz && rm dotnext.tar.gz")
exit_code = stdout.channel.recv_exit_status()
print(f"  Extracted (exit: {exit_code})")

# ─── 2. Kill old server hard ──────────────────────────────────────────────
print("Killing old servers...")
stdin, stdout, stderr = ssh.exec_command("ps aux | grep -E 'node.*server\\.js' | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null; sleep 3")
stdout.channel.recv_exit_status()
print("  Killed")

# ─── 3. Start new server ─────────────────────────────────────────────────
print("Starting server...")
node = "/opt/alt/alt-nodejs20/root/usr/bin/node"
# Server reads HOSTNAME env var, not HOST
cmd = "cd " + REMOTE + " && nohup env HOSTNAME=127.0.0.1 PORT=3099 " + node + " server.js > server.log 2>&1 &"
ssh.exec_command(cmd)
time.sleep(8)

# ─── 4. Verify ────────────────────────────────────────────────────────────
stdin, stdout, stderr = ssh.exec_command("cat " + REMOTE + "/server.log")
out = stdout.read().decode("utf-8", "ignore")
print("Log:", out[-1000:])

stdin, stdout, stderr = ssh.exec_command("ps aux | grep server.js | grep -v grep")
proc = stdout.read().decode("utf-8", "ignore")
if proc.strip():
    print("Server running!")
else:
    print("Server NOT running")

stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 http://127.0.0.1:3099/")
code = stdout.read().decode().strip()
print(f"Homepage HTTP: {code}")

sftp.close()
ssh.close()
print("Deploy complete.")
