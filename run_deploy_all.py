import os
import sys
import time
import tempfile
import paramiko

# Load environment variables from .env.local if available
def load_local_env():
    env = {}
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                eq_idx = line.find("=")
                if eq_idx != -1:
                    key = line[:eq_idx].strip()
                    val = line[eq_idx+1:].strip()
                    env[key] = val
    return env

local_env = load_local_env()

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def run_ssh(ssh, cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    return stdout.channel.recv_exit_status()

def package_app():
    log("Creating deployment tar archives using native tar...")
    temp_dir = tempfile.gettempdir()
    dotnext_tar = os.path.join(temp_dir, "standalone_dotnext.tar.gz")
    static_tar = os.path.join(temp_dir, "next_static.tar.gz")
    public_tar = os.path.join(temp_dir, "public_assets.tar.gz")

    for f in [dotnext_tar, static_tar, public_tar]:
        if os.path.exists(f):
            try: os.remove(f)
            except: pass

    # 1. Standalone archive
    standalone_path = os.path.abspath(".next/standalone")
    if not os.path.exists(standalone_path):
        log("Error: .next/standalone folder missing! Building now...")
        os.system("npm run build")

    log("Compressing .next/standalone with native tar...")
    os.system(f'tar -czf "{dotnext_tar}" -C "{standalone_path}" .')
    log("Standalone compressed successfully.")

    # 2. Static archive
    log("Compressing .next/static with native tar...")
    static_parent = os.path.abspath(".next")
    os.system(f'tar -czf "{static_tar}" -C "{static_parent}" static')
    log("Static files compressed successfully.")

    # 3. Public archive
    log("Compressing public/ assets with native tar...")
    os.system(f'tar -czf "{public_tar}" public')
    log("Public assets compressed successfully.")

    return dotnext_tar, static_tar, public_tar

def deploy_hostinger(dotnext_tar, static_tar, public_tar):
    hostinger_ip = local_env.get("HOSTINGER_IP", "145.79.58.122")
    hostinger_port = int(local_env.get("HOSTINGER_PORT", "65002"))
    hostinger_user = local_env.get("HOSTINGER_USER", "u892283443")
    hostinger_pass = local_env.get("HOSTINGER_PASS", "")
    log(f"--- Uploading & Deploying to Hostinger ({hostinger_ip}) ---")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(hostinger_ip, port=hostinger_port, username=hostinger_user, password=hostinger_pass, timeout=30)
        sftp = ssh.open_sftp()
        log("Hostinger SSH connected.")

        REMOTE_FRONTEND = "/home/u892283443/frontend"
        REMOTE_PUBLIC_HTML = "/home/u892283443/domains/darkslategrey-chough-173926.hostingersite.com/public_html"
        REMOTE_IMAGES = REMOTE_PUBLIC_HTML + "/images"

        log("Uploading standalone bundle to Hostinger...")
        sftp.put(dotnext_tar, f"{REMOTE_FRONTEND}/dotnext.tar.gz")
        run_ssh(ssh, f"cd {REMOTE_FRONTEND} && tar -xzf dotnext.tar.gz && rm dotnext.tar.gz")
        log("Standalone extracted on Hostinger.")

        log("Uploading static files to Hostinger...")
        sftp.put(static_tar, f"{REMOTE_PUBLIC_HTML}/static.tar.gz")
        run_ssh(ssh, f"mkdir -p {REMOTE_PUBLIC_HTML}/_next && cd {REMOTE_PUBLIC_HTML}/_next && tar -xzf ../static.tar.gz && rm ../static.tar.gz")
        log("Static files extracted on Hostinger.")

        log("Uploading public assets to Hostinger...")
        sftp.put(public_tar, f"{REMOTE_PUBLIC_HTML}/public.tar.gz")
        run_ssh(ssh, f"cd {REMOTE_PUBLIC_HTML} && tar -xzf public.tar.gz && rm public.tar.gz")
        log("Public assets extracted on Hostinger.")

        log("Ensuring upload directory permissions...")
        run_ssh(ssh, f"mkdir -p {REMOTE_IMAGES}/uploads && chmod 755 {REMOTE_IMAGES}/uploads")

        log("Restarting Hostinger server process...")
        run_ssh(ssh, "ps aux | grep -E 'node.*server\\.js' | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null")
        time.sleep(2)

        node_bin = "/opt/alt/alt-nodejs20/root/usr/bin/node"
        start_cmd = (
            f"cd {REMOTE_FRONTEND} && "
            f"nohup env HOSTNAME=127.0.0.1 PORT=3099 UPLOAD_DIR={REMOTE_IMAGES} "
            f"{node_bin} server.js > server.log 2>&1 &"
        )
        run_ssh(ssh, start_cmd)
        time.sleep(4)

        stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3099/")
        http_code = stdout.read().decode().strip()
        log(f"Hostinger Server HTTP status: {http_code}")

        sftp.close()
        ssh.close()
        log("Hostinger deployment SUCCESSFUL!")
    except Exception as e:
        log(f"Hostinger deployment exception: {e}")

def deploy_vps_root(dotnext_tar, static_tar, public_tar):
    vps_ip = local_env.get("VPS_IP", "88.222.242.53")
    vps_port = int(local_env.get("VPS_PORT", "22"))
    vps_user = local_env.get("VPS_USER", "root")
    vps_pass = local_env.get("VPS_PASS", "")
    log(f"--- Uploading & Deploying to VPS ({vps_ip}) ---")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(vps_ip, port=vps_port, username=vps_user, password=vps_pass, timeout=30)
        sftp = ssh.open_sftp()
        log("VPS SSH connected.")

        REMOTE_DIR = "/var/www/boutiquevastra"
        run_ssh(ssh, f"mkdir -p {REMOTE_DIR}")

        log("Uploading standalone to VPS...")
        sftp.put(dotnext_tar, f"{REMOTE_DIR}/standalone.tar.gz")
        log("Uploading static assets to VPS...")
        sftp.put(static_tar, f"{REMOTE_DIR}/static.tar.gz")
        log("Uploading public assets to VPS...")
        sftp.put(public_tar, f"{REMOTE_DIR}/public.tar.gz")

        log("Extracting files on VPS...")
        run_ssh(ssh, f"cd {REMOTE_DIR} && tar -xzf standalone.tar.gz && rm standalone.tar.gz")
        run_ssh(ssh, f"mkdir -p {REMOTE_DIR}/.next")
        run_ssh(ssh, f"cd {REMOTE_DIR}/.next && tar -xzf ../static.tar.gz && rm ../static.tar.gz")
        run_ssh(ssh, f"cd {REMOTE_DIR} && tar -xzf public.tar.gz && rm public.tar.gz")
        log("Extraction complete on VPS.")

        # Construct env file content dynamically from local_env
        mongodb_uri = local_env.get("MONGODB_URI", "")
        mongodb_db_name = local_env.get("MONGODB_DB_NAME", "boutiique_vastraa")
        shiprocket_email = local_env.get("SHIPROCKET_EMAIL", "")
        shiprocket_password = local_env.get("SHIPROCKET_PASSWORD", "")
        shiprocket_pickup = local_env.get("SHIPROCKET_PICKUP_LOCATION", "Home")
        shiprocket_auto = local_env.get("SHIPROCKET_AUTO_CREATE_SHIPMENT", "true")
        phonepe_merchant = local_env.get("PHONEPE_MERCHANT_ID", "")
        phonepe_salt = local_env.get("PHONEPE_SALT_KEY", "")
        phonepe_salt_idx = local_env.get("PHONEPE_SALT_INDEX", "1")
        phonepe_host = local_env.get("PHONEPE_HOST_URL", "https://api.phonepe.com/apis/hermes")
        email_host = local_env.get("EMAIL_HOST", "smtp.gmail.com")
        email_port = local_env.get("EMAIL_PORT", "465")
        email_user = local_env.get("EMAIL_USER", "")
        email_pass = local_env.get("EMAIL_PASS", "")
        email_from = local_env.get("EMAIL_FROM", "")
        email_from_name = local_env.get("EMAIL_FROM_NAME", "Boutiique Vastraa")
        google_client_id = local_env.get("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "")
        google_client_secret = local_env.get("GOOGLE_CLIENT_SECRET", "")

        env_content = f"""MONGODB_URI={mongodb_uri}
MONGODB_DB_NAME={mongodb_db_name}
ENABLE_DATABASE=true
NEXT_PUBLIC_SITE_URL=https://boutiiquevastraa.com
PORT=3000

SHIPROCKET_EMAIL={shiprocket_email}
SHIPROCKET_PASSWORD={shiprocket_password}
SHIPROCKET_PICKUP_LOCATION={shiprocket_pickup}
SHIPROCKET_AUTO_CREATE_SHIPMENT={shiprocket_auto}

PHONEPE_MERCHANT_ID={phonepe_merchant}
PHONEPE_SALT_KEY={phonepe_salt}
PHONEPE_SALT_INDEX={phonepe_salt_idx}
PHONEPE_HOST_URL={phonepe_host}

# Email configuration (Gmail SMTP)
EMAIL_HOST={email_host}
EMAIL_PORT={email_port}
EMAIL_USER={email_user}
EMAIL_PASS={email_pass}
EMAIL_FROM={email_from}
EMAIL_FROM_NAME={email_from_name}

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID={google_client_id}
GOOGLE_CLIENT_SECRET={google_client_secret}
"""
        ssh_env_cmd = f"cat << 'EOF' > {REMOTE_DIR}/.env\n{env_content}\nEOF"
        run_ssh(ssh, ssh_env_cmd)

        log("Restarting application via PM2 on VPS...")
        stdin, stdout, stderr = ssh.exec_command("pm2 describe boutiquevastra")
        if stdout.channel.recv_exit_status() == 0:
            run_ssh(ssh, f"cd {REMOTE_DIR} && pm2 restart boutiquevastra")
        else:
            run_ssh(ssh, f"cd {REMOTE_DIR} && pm2 start server.js --name boutiquevastra --env PORT=3000")
        
        run_ssh(ssh, "pm2 save")
        time.sleep(3)

        stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/")
        http_code = stdout.read().decode().strip()
        log(f"VPS Server HTTP status: {http_code}")

        sftp.close()
        ssh.close()
        log("VPS deployment SUCCESSFUL!")
    except Exception as e:
        log(f"VPS deployment exception: {e}")

def main():
    log("=== DEPLOYMENT STARTED ===")
    dotnext, static, public = package_app()
    deploy_hostinger(dotnext, static, public)
    deploy_vps_root(dotnext, static, public)
    log("=== DEPLOYMENT COMPLETE FOR ALL SERVERS ===")

if __name__ == "__main__":
    main()
