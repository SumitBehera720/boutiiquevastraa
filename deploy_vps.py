import os
import sys
import tarfile
import time
import tempfile
import paramiko

# Reconfigure stdout to use UTF-8 to prevent encoding errors on Windows
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

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

# Connection details
VPS_IP = local_env.get("VPS_IP", "")
VPS_PORT = int(local_env.get("VPS_PORT", "22"))
VPS_USER = local_env.get("VPS_USER", "")
VPS_PASS = local_env.get("VPS_PASS", "")
DOMAIN = local_env.get("DOMAIN", "boutiiquevastraa.com")

# Remote path
REMOTE_DIR = "/var/www/boutiquevastra"


def run_local_build():
    print("Building Next.js application locally...")
    # Run npm run build
    exit_code = os.system("npm run build")
    if exit_code != 0:
        print("Error: Local build failed!")
        sys.exit(1)
    print("Local build completed successfully.")

def main():
    run_local_build()

    print("Connecting to VPS via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    except Exception as e:
        print(f"Error: SSH connection failed: {e}")
        sys.exit(1)

    print("Connected to VPS!")
    sftp = ssh.open_sftp()

    def exec_cmd(cmd, ignore_error=False):
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode("utf-8", "ignore").strip()
        err = stderr.read().decode("utf-8", "ignore").strip()
        
        # Safely print stdout/stderr by replacing characters that can't be represented
        if out:
            print("  STDOUT:")
            try:
                print(out)
            except Exception:
                try:
                    encoding = sys.stdout.encoding or "utf-8"
                    print(out.encode(encoding, errors="replace").decode(encoding))
                except Exception:
                    print("[Stdout print failed due to encoding]")
                    
        if err:
            print("  STDERR:")
            try:
                print(err)
            except Exception:
                try:
                    encoding = sys.stdout.encoding or "utf-8"
                    print(err.encode(encoding, errors="replace").decode(encoding))
                except Exception:
                    print("[Stderr print failed due to encoding]")
                    
        if exit_code != 0 and not ignore_error:
            print(f"Error: command failed with exit code {exit_code}")
            sys.exit(1)
        return exit_code, out, err

    print("Checking for conflicting Nginx files...")
    # Find any active configuration files that mention the domain
    exec_cmd("grep -rn 'boutiquevastra.com' /etc/nginx/", ignore_error=True)
    
    # List sites-enabled directory
    exec_cmd("ls -la /etc/nginx/sites-enabled/")

    print("Installing system updates and prerequisites on VPS...")
    exec_cmd("apt-get update -y")
    exec_cmd("apt-get install -y curl build-essential xz-utils")

    # Verify/Install Node.js 20
    exit_code, out, err = exec_cmd("node -v", ignore_error=True)
    if exit_code != 0 or not out.startswith("v20"):
        print("Installing Node.js 20...")
        exec_cmd("curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
        exec_cmd("apt-get install -y nodejs")
    else:
        print("Node.js 20 is already installed.")

    # Verify/Install PM2
    exit_code, out, err = exec_cmd("pm2 -v", ignore_error=True)
    if exit_code != 0:
        print("Installing PM2...")
        exec_cmd("npm install -g pm2")

    # Verify/Install Nginx
    exit_code, out, err = exec_cmd("nginx -v", ignore_error=True)
    if exit_code != 0:
        print("Installing Nginx...")
        exec_cmd("apt-get install -y nginx")

    # Verify/Install Certbot
    exit_code, out, err = exec_cmd("certbot --version", ignore_error=True)
    if exit_code != 0:
        print("Installing Certbot...")
        exec_cmd("apt-get install -y certbot python3-certbot-nginx")

    nginx_conf = f"""server {{
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};

    client_max_body_size 0;

    location / {{
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }}
}}
"""

    print("Configuring Nginx proxy config...")
    # Write default block
    ssh_conf_cmd = f"cat << 'EOF' > /etc/nginx/sites-available/default\n{nginx_conf}\nEOF"
    exec_cmd(ssh_conf_cmd)
    
    # Disable default page block if it has a symlink conflict, but writing default is fine
    # Let's run Nginx configuration test
    exec_cmd("nginx -t", ignore_error=True)
    exec_cmd("systemctl restart nginx", ignore_error=True)

    # Packaging local files
    temp_dir = tempfile.gettempdir()
    standalone_tar = os.path.join(temp_dir, "standalone.tar.gz")
    static_tar = os.path.join(temp_dir, "static.tar.gz")
    public_tar = os.path.join(temp_dir, "public.tar.gz")

    for f in [standalone_tar, static_tar, public_tar]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass

    print("Packaging local standalone build...")
    with tarfile.open(standalone_tar, "w:gz") as tar:
        standalone_path = os.path.abspath(".next/standalone")
        for item in os.listdir(standalone_path):
            tar.add(os.path.join(standalone_path, item), arcname=item)

    print("Packaging static files...")
    with tarfile.open(static_tar, "w:gz") as tar:
        static_path = os.path.abspath(".next/static")
        tar.add(static_path, arcname="static")

    print("Packaging public assets...")
    with tarfile.open(public_tar, "w:gz") as tar:
        public_path = os.path.abspath("public")
        tar.add(public_path, arcname="public")

    print("Creating remote application folder...")
    exec_cmd(f"mkdir -p {REMOTE_DIR}")

    print("Uploading packages to VPS...")
    sftp.put(standalone_tar, f"{REMOTE_DIR}/standalone.tar.gz")
    sftp.put(static_tar, f"{REMOTE_DIR}/static.tar.gz")
    sftp.put(public_tar, f"{REMOTE_DIR}/public.tar.gz")

    print("Extracting packages on VPS...")
    exec_cmd(f"cd {REMOTE_DIR} && tar -xzf standalone.tar.gz && rm standalone.tar.gz")
    exec_cmd(f"mkdir -p {REMOTE_DIR}/.next")
    exec_cmd(f"cd {REMOTE_DIR}/.next && tar -xzf ../static.tar.gz && rm ../static.tar.gz")
    exec_cmd(f"cd {REMOTE_DIR} && tar -xzf public.tar.gz && rm public.tar.gz")

    # Load environment variables from .env.local if available
    local_env = {}
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
                    local_env[key] = val

    mongodb_uri = local_env.get("MONGODB_URI", "")
    mongodb_db_name = local_env.get("MONGODB_DB_NAME", "boutiique_vastraa")
    shiprocket_email = local_env.get("SHIPROCKET_EMAIL", "")
    shiprocket_password = local_env.get("SHIPROCKET_PASSWORD", "")
    shiprocket_pickup = local_env.get("SHIPROCKET_PICKUP_LOCATION", "Home")
    shiprocket_auto = local_env.get("SHIPROCKET_AUTO_CREATE_SHIPMENT", "true")
    weight = local_env.get("DEFAULT_PACKAGE_WEIGHT", "0.5")
    length = local_env.get("DEFAULT_PACKAGE_LENGTH", "20")
    breadth = local_env.get("DEFAULT_PACKAGE_BREADTH", "15")
    height = local_env.get("DEFAULT_PACKAGE_HEIGHT", "5")
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
NEXT_PUBLIC_SITE_URL=https://{DOMAIN}
PORT=3000

# Shiprocket Integration
SHIPROCKET_EMAIL={shiprocket_email}
SHIPROCKET_PASSWORD={shiprocket_password}
SHIPROCKET_PICKUP_LOCATION={shiprocket_pickup}
SHIPROCKET_AUTO_CREATE_SHIPMENT={shiprocket_auto}
DEFAULT_PACKAGE_WEIGHT={weight}
DEFAULT_PACKAGE_LENGTH={length}
DEFAULT_PACKAGE_BREADTH={breadth}
DEFAULT_PACKAGE_HEIGHT={height}

# PhonePe Integration Configs
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

    print("Writing production environment variables (.env) on VPS...")
    ssh_env_cmd = f"cat << 'EOF' > {REMOTE_DIR}/.env\n{env_content}\nEOF"
    exec_cmd(ssh_env_cmd)

    print("Managing application with PM2...")
    # Check if boutiquevastra is already running
    exit_code, out, err = exec_cmd("pm2 describe boutiquevastra", ignore_error=True)
    if exit_code == 0:
        exec_cmd(f"cd {REMOTE_DIR} && pm2 restart boutiquevastra")
    else:
        exec_cmd(f"cd {REMOTE_DIR} && pm2 start server.js --name boutiquevastra --env PORT=3000")

    exec_cmd("pm2 save")
    # Setup PM2 startup configuration
    exec_cmd("pm2 startup", ignore_error=True)

    print("Configuring Let's Encrypt SSL...")
    certbot_cmd = f"certbot --nginx -d {DOMAIN} -d www.{DOMAIN} --non-interactive --agree-tos -m contact@{DOMAIN} --redirect"
    exit_code, out, err = exec_cmd(certbot_cmd, ignore_error=True)
    if exit_code != 0:
        print("\n" + "="*60)
        print("WARNING: SSL certification failed.")
        print("This is likely because your domain DNS records are not yet pointing to the VPS IP.")
        print("The website will still work on http:// (port 80) for now.")
        print(f"Rerun the following command on your VPS via SSH once DNS propagates to add SSL:")
        print(f"  {certbot_cmd}")
        print("="*60 + "\n")
    else:
        print("SSL (HTTPS) successfully configured!")

    print("Cleaning up local temporary packages...")
    sftp.close()
    ssh.close()
    
    try:
        os.remove(standalone_tar)
        os.remove(static_tar)
        os.remove(public_tar)
    except Exception as e:
        print(f"Non-critical cleanup warning: {e}")

    print("Deployment process finished!")

if __name__ == "__main__":
    main()
