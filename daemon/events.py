import threading
import docker
import json

from utils import retrieve_all_risks
 
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def docker_event_listener():
    
    client = docker.from_env()
    
    for event in client.api.events(decode=True):
        if event.get("Type") == "container" and event.get("Action") in ("create", "start"):
            cid = event.get("id")[:12]
            c_image = event.get("Actor", {}).get("Attributes", {}).get("image", "")
            c_action = event["Action"]
            print(f"{GREEN}[INFO] [Docker Listener]{RESET} {cid} on event {event['Action']} with image ({c_image})\n")
            # print("Event details", event)
            
            # Container Inspection
            metadata_inspection = client.api.inspect_container(cid)
            risks_mapping = retrieve_all_risks(metadata_inspection)
            
            print(f"Result from the inspect on container {cid} \n {json.dumps(risks_mapping['metadata'], indent=2)} \n")
            # Let's think about how memory is used inisde a container
            # TODO: Getting some lagging - Need to fix it
            if risks_mapping["risks"]:
                print(f"[!] Risks found for container {cid}:")
                for r in risks_mapping["risks"]:
                    print(f"{RED} - {r['rule']} ({r['severity']}){RESET}: {r['description']}")
        

def docker_thread():
    docker_listener_thread = threading.Thread(target=docker_event_listener, daemon=True).start()
    return docker_event_listener
