import os, json, datetime

def retrieve_all_risks(cid, metadata, image, action):
    
    DANGEROUS_CAPS = {"SYS_ADMIN", "SYS_PTRACE", "NET_ADMIN"}
    SENSITIVE_PATHS = ["/", "/etc", "root", "/var/run", "/boot", "/dev", "/etc", "/lib", "/proc", "/sys", "/usr"]
    # Array of risks
    risks = []
    
    c_creation_time = metadata.get("Created")
    c_container_id =  metadata.get("Id")
    c_volumes_mounted = metadata.get("HostConfig", {}).get("Binds", [])
    c_capAdd = metadata.get("HostConfig", {}).get("CapAdd", [])
    c_capDrop = metadata.get("HostConfig", {}).get("CapDrop")
    c_privileged_flag = metadata.get("HostConfig", {}).get("Privileged", False)
    c_user = metadata.get("Config", {}).get("User")
    c_securityOpt = metadata.get("HostConfig", {}).get("SecurityOpt")
    c_networks = metadata.get("NetworkSettings", {}).get("Networks")
    c_env = metadata.get("Config", {}).get("Env")
    
    container_json = {
        "container_id": c_container_id,
        "timestamp": c_creation_time,
        "volumesMounted": c_volumes_mounted,
        "capabilitiesAdded": c_capAdd,
        "capabilitiesDropped": c_capDrop,
        "privileged": c_privileged_flag,
        "user": c_user,
        "securityOptions": c_securityOpt,
        "networks": c_networks,
        "environmentVariables": c_env
    }
    
    if c_privileged_flag == True:
        risks.append({
            "rule": "Privileged mode enabled",
            "severity": "HIGH",
            "description": "Container runs with full host privileges"
        })
    
    if not c_user or c_user == "0" or c_user.lower() == "root":
        risks.append({
            "rule": "Container runs as root",
            "severity": "MEDIUM",
            "description": f"User={c_user or 'root'}"
        })
    
    for cap in c_capAdd or []:
        if cap in DANGEROUS_CAPS:
            risks.append({
                "rule": f"Dangerous capability added: {cap}",
                "severity": "HIGH",
                "description": f"Capability {cap} allows host or kernel manipulation."
            })
            
    for mount in c_volumes_mounted or []:
        if "docker.sock" in mount: 
            risks.append({
                "rule": "Docker socket exposed",
                "severity": "CRITICAL",
                "description": f"Docker socket mounted: {mount}"
            })
        for path in SENSITIVE_PATHS:
            if mount.startswith(path) or f":{path}" in mount:
                risks.append({
                    "rule": "Sensitive host path mounted",
                    "severity": "HIGH",
                    "description": f"Mounting sensitive path: {mount}"
                })
                break
    
    return {
        "id": cid,
        "image": image, 
        "action": action,
        "metadata": container_json,
        "risks": risks,
        "log_time": datetime.datetime.utcnow().isoformat() + 'Z'
    }
   
   
def persist_alert(alert_json, file):
    os.makedirs(os.path.dirname(file), exist_ok=True)
    with open(file, "a") as f:
        f.write(json.dumps(alert_json) + "\n")  