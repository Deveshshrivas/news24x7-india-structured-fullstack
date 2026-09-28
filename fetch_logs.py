import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    client.connect('193.203.185.104', port=65002, username='u862131964', password='Devesh@060', timeout=10)
    sftp = client.open_sftp()
    file_path = '/home/u862131964/domains/news24x7india.com/hbuilds/current/nodejs/server.mjs'
    
    with sftp.file(file_path, 'r') as f:
        code = f.read().decode('utf-8')
        
    old_str = "import { app as backendApp, initializeDatabase } from './backend/dist/server.js';\nawait initializeDatabase();"
    new_str = "const { app: backendApp, initializeDatabase } = await import('./backend/dist/server.js');\nawait initializeDatabase();"
    
    if old_str in code:
        code = code.replace(old_str, new_str)
        with sftp.file(file_path, 'w') as f:
            f.write(code)
        print("Patched server.mjs to use dynamic import!")
    else:
        print("Could not find target string in server.mjs")
        
    sftp.close()
    
    # Restart Node
    client.exec_command('pkill -f -9 node; pkill -f -9 lsnode')
    print("Restarted processes")
    client.close()
except Exception as e:
    print(f"Error: {e}")
