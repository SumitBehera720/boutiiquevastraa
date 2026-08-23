import os
import sys
import time
import tarfile
import paramiko

sys.stdout.reconfigure(encoding="utf-8")

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

CWD = os.getcwd()
DOTNEXT_TAR = os.path.join(CWD, "standalone_dotnext.tar.gz")
STATIC_TAR = os.path.join(CWD, "next_static.tar.gz")
PUBLIC_TAR = os.path.join(CWD, "public_assets.tar.gz")

import shutil

def create_archives():
    log("Creating fresh deployment archives...")
    
    # Ensure standalone .env is updated with local .env.local
    if os.path.exists(".env.local"):
        shutil.copyfile(".env.local", os.path.join(CWD, ".next", "standalone", ".env"))
        shutil.copyfile(".env.local", os.path.join(CWD, ".next", "standalone", ".env.local"))

    # 1. Archive .next/standalone/.next
    standalone_dotnext = os.path.join(CWD, ".next", "standalone", ".next")
    log(f"Archiving standalone .next from {standalone_dotnext}...")
    if os.path.exists(DOTNEXT_TAR):
        try: os.remove(DOTNEXT_TAR)
        except: pass
        
    with tarfile.open(DOTNEXT_TAR, "w:gz") as tar:
        tar.add(standalone_dotnext, arcname=".next")
    log("standalone_dotnext.tar.gz created.")

    # 2. Archive .next/static
    static_dir = os.path.join(CWD, ".next", "static")
    log(f"Archiving static files from {static_dir}...")
    if os.path.exists(STATIC_TAR):
        try: os.remove(STATIC_TAR)
        except: pass
        
    with tarfile.open(STATIC_TAR, "w:gz") as tar:
        tar.add(static_dir, arcname="static")
    log("next_static.tar.gz created.")

    # 3. Archive public directory (images, videos, uploads)
    public_dir = os.path.join(CWD, "public")
    log(f"Archiving public directory from {public_dir}...")
    if os.path.exists(PUBLIC_TAR):
        try: os.remove(PUBLIC_TAR)
        except: pass
        
    with tarfile.open(PUBLIC_TAR, "w:gz") as tar:
        def filter_uploads(tarinfo):
            if "public/images/uploads" in tarinfo.name or "public\\images\\uploads" in tarinfo.name:
                return None
            return tarinfo
        tar.add(public_dir, arcname="public", filter=filter_uploads)
    log("public_assets.tar.gz created.")

def deploy_vps_root():
    vps_ip = local_env.get("VPS_IP", "88.222.242.53")
    vps_port = int(local_env.get("VPS_PORT", "22"))
    vps_user = local_env.get("VPS_USER", "root")
    vps_pass = local_env.get("VPS_PASS", "")
    log(f"=== Deploying to Target VPS ({vps_ip}:{vps_port}) ===")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(vps_ip, port=vps_port, username=vps_user, password=vps_pass, timeout=30)
    sftp = ssh.open_sftp()
    log("VPS SSH connected!")

    REMOTE_DIR = "/var/www/boutiquevastra"
    log("Clearing old server cache on VPS...")
    ssh.exec_command(f"rm -rf {REMOTE_DIR}/.next")
    ssh.exec_command(f"mkdir -p {REMOTE_DIR}")

    log("Uploading standalone bundle to VPS...")
    sftp.put(DOTNEXT_TAR, REMOTE_DIR + "/dotnext.tar.gz", confirm=False)
    ssh.exec_command(f"cd {REMOTE_DIR} && tar -xzf dotnext.tar.gz && rm dotnext.tar.gz")
    log("Standalone bundle extracted on VPS.")

    log("Uploading static files to VPS...")
    sftp.put(STATIC_TAR, REMOTE_DIR + "/static.tar.gz", confirm=False)
    ssh.exec_command(f"mkdir -p {REMOTE_DIR}/.next && cd {REMOTE_DIR}/.next && tar -xzf ../static.tar.gz && rm ../static.tar.gz")
    log("Static files extracted on VPS.")

    log("Uploading public assets (images & videos) to VPS...")
    sftp.put(PUBLIC_TAR, REMOTE_DIR + "/public.tar.gz", confirm=False)
    ssh.exec_command(f"cd {REMOTE_DIR} && tar -xzf public.tar.gz && rm public.tar.gz")
    log("Public assets extracted on VPS.")

    log("Uploading server.js, package.json & env files to VPS...")
    sftp.put(os.path.join(CWD, ".next", "standalone", "server.js"), REMOTE_DIR + "/server.js", confirm=False)
    sftp.put(os.path.join(CWD, ".next", "standalone", "package.json"), REMOTE_DIR + "/package.json", confirm=False)
    if os.path.exists(os.path.join(CWD, ".env.local")):
        sftp.put(os.path.join(CWD, ".env.local"), REMOTE_DIR + "/.env.local", confirm=False)
        sftp.put(os.path.join(CWD, ".env.local"), REMOTE_DIR + "/.env", confirm=False)

    log("Restarting boutiquevastra PM2 process on VPS...")
    ssh.exec_command(f"cd {REMOTE_DIR} && pm2 restart boutiquevastra --update-env || pm2 start server.js --name boutiquevastra")
    ssh.exec_command("pm2 save")
    time.sleep(4)

    stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/")
    code = stdout.read().decode().strip()
    log(f"VPS Server HTTP status: {code}")

    sftp.close()
    ssh.close()
    log("VPS deployment SUCCESSFUL!")

def deploy_hostinger():
    log("=== Deploying to Hostinger (145.79.58.122:65002) ===")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect("145.79.58.122", port=65002, username="u892283443", password="Jrs@45@jrs", timeout=30)
        sftp = ssh.open_sftp()
        log("Hostinger SSH connected!")

        REMOTE_FRONTEND = "/home/u892283443/frontend"
        REMOTE_PUBLIC_HTML = "/home/u892283443/domains/darkslategrey-chough-173926.hostingersite.com/public_html"
        REMOTE_IMAGES = REMOTE_PUBLIC_HTML + "/images"

        log("Uploading standalone bundle to Hostinger...")
        sftp.put(DOTNEXT_TAR, REMOTE_FRONTEND + "/dotnext.tar.gz", confirm=False)
        ssh.exec_command(f"cd {REMOTE_FRONTEND} && tar -xzf dotnext.tar.gz && rm dotnext.tar.gz")

        log("Uploading static files to Hostinger...")
        sftp.put(STATIC_TAR, REMOTE_FRONTEND + "/static.tar.gz", confirm=False)
        ssh.exec_command(f"mkdir -p {REMOTE_PUBLIC_HTML}/_next && cd {REMOTE_PUBLIC_HTML}/_next && tar -xzf {REMOTE_FRONTEND}/static.tar.gz && rm {REMOTE_FRONTEND}/static.tar.gz")

        sftp.put(os.path.join(CWD, ".next", "standalone", "server.js"), REMOTE_FRONTEND + "/server.js", confirm=False)
        sftp.put(os.path.join(CWD, ".next", "standalone", "package.json"), REMOTE_FRONTEND + "/package.json", confirm=False)
        if os.path.exists(os.path.join(CWD, ".env.local")):
            sftp.put(os.path.join(CWD, ".env.local"), REMOTE_FRONTEND + "/.env.local", confirm=False)
            sftp.put(os.path.join(CWD, ".env.local"), REMOTE_FRONTEND + "/.env", confirm=False)

        ssh.exec_command("ps aux | grep -E 'node.*server\\.js' | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null")
        time.sleep(2)

        node = "/opt/alt/alt-nodejs20/root/usr/bin/node"
        cmd = f"cd {REMOTE_FRONTEND} && nohup env HOSTNAME=127.0.0.1 PORT=3099 UPLOAD_DIR={REMOTE_IMAGES} {node} server.js > server.log 2>&1 &"
        ssh.exec_command(cmd)
        time.sleep(3)

        stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3099/")
        code = stdout.read().decode().strip()
        log(f"Hostinger Server HTTP status: {code}")

        sftp.close()
        ssh.close()
        log("Hostinger deployment SUCCESSFUL!")
    except Exception as e:
        log(f"Hostinger deployment notice: {e}")

def main():
    log("Starting Fast Deployment Process...")
    create_archives()
    deploy_vps_root()
    deploy_hostinger()
    log("=== ALL DEPLOYMENT STEPS COMPLETED ===")

if __name__ == "__main__":
    main()
