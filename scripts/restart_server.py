import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("145.79.58.122", port=65002, username="u892283443", password="Jrs@45@jrs")

# Kill ALL node processes
ssh.exec_command("pkill -9 -f node 2>/dev/null")
time.sleep(2)

# Restart server
node = "/opt/alt/alt-nodejs20/root/usr/bin/node"
cmd = "cd /home/u892283443/frontend && nohup env HOST=127.0.0.1 PORT=3099 " + node + " server.js > server.log 2>&1 &"
ssh.exec_command(cmd)
time.sleep(5)

# Check if running
stdin, stdout, stderr = ssh.exec_command("ps aux | grep server.js | grep -v grep")
out = stdout.read().decode()
if out:
    print("Server running:", out[:200])
else:
    print("Server NOT running")
    stdin, stdout, stderr = ssh.exec_command("tail -30 /home/u892283443/frontend/server.log")
    print("Log:", stdout.read().decode()[-500:])

ssh.close()
