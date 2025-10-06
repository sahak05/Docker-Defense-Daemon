# Docker-Defense-Daemon

## Quick ReadMe

Application is served with Flask and docker as we need to run several containers at the same time.
Docker-compose has our daemon-defense app inside with the falco container which can be initialized right now
Also connecting the falco output to the daemon is setup but not finish. This can be test by:
### Run the docker compose file 
- To run the app => `docker compose up -d`
- To stop it => `docker compose down`
### See the logs
- See falco container logs => `docker compose logs -f falco`
- See daemon container logs => `docker compose logs -f daemon-defense`    
### Testing connectivity from falco to daemon
- Run a light container and open a shell, Falco has basic rule when it warns when a container spawns a shell => `docker run --rm -itd alpine sh`
- You should see in the daemon log a JSOn line with the informations.

## Good to know
- How docker network works: https://www.youtube.com/watch?v=bKFMS5C4CG0&list=WL&index=2&t=17s
- Docker compose quick start: https://docs.docker.com/compose/gettingstarted/
- Trivy Github: https://github.com/aquasecurity/trivy
- Falco Github: https://github.com/falcosecurity/falco
- Falco documentation: https://falco.org/docs/setup/container/
- Flask tutorial: https://www.geeksforgeeks.org/python/flask-tutorial/
- Docker SDK: https://docker-py.readthedocs.io/en/stable/

  
