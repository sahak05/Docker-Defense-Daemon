def retrieve_all_risks(metadata):
    
    DANGEROUS_CAPS = {"SYS_ADMIN", "SYS_PTRACE", "NET_ADMIN"}
    SENSITIVE_PATHS = ["/", "/etc", "root", "/var/run", "/boot", "/dev", "/etc", "/lib", "/proc", "/sys", "/usr"]
    # Array of risks
    risks = []
    
    c_creation_time = metadata.get("Created")
    c_volumes_mounted = metadata.get("HostConfig", {}).get("Binds", [])
    c_capAdd = metadata.get("HostConfig", {}).get("CapAdd", [])
    c_capDrop = metadata.get("HostConfig", {}).get("CapDrop")
    c_privileged_flag = metadata.get("HostConfig", {}).get("Privileged", False)
    c_user = metadata.get("Config", {}).get("User")
    c_securityOpt = metadata.get("HostConfig", {}).get("SecurityOpt")
    c_networks = metadata.get("NetworkSettings", {}).get("Networks")
    c_env = metadata.get("Config", {}).get("Env")
    
    container_json = {
        "Created": c_creation_time,
        "VolumesMounted": c_volumes_mounted,
        "CapabilitiesAdded": c_capAdd,
        "CapabilitiesDropped": c_capDrop,
        "Privileged": c_privileged_flag,
        "User": c_user,
        "SecurityOptions": c_securityOpt,
        "Networks": c_networks,
        "EnvironmentVariables": c_env
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
        "metadata": container_json,
        "risks": risks
    }
    