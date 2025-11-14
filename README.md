# Docker-Defense-Daemon

## Quick ReadMe

Application is served with Flask and Docker. The React UI is now built on the host and copied into the image (no Node in runtime). Docker Compose orchestrates the daemon and Falco.

See the Quick Start guide for the exact commands and tips:

- Quick Start: ./QuickStart.md

### Run with Docker Compose

- Recommended: `docker compose up -d --build`
- Without rebuild: `docker compose up -d`
- Stop: `docker compose down`

Notes:

- UI is copied from `packages/ui/build` into `daemon/static`. If you change the UI, rebuild it locally first, then re-run compose with `--build`.
- App: http://localhost:8080

### See the logs

- See falco container logs => `docker compose logs -f falco`
- See daemon container logs => `docker compose logs -f daemon-defense`

### Testing connectivity from Falco to daemon

- Run a light container and open a shell, Falco has basic rule when it warns when a container spawns a shell => `docker run --rm -itd alpine sh`
- You should see in the daemon log a JSOn line with the informations.

### Container with Full risk enabled to test security app logs those risks

```
 docker run -it --rm --privileged -v /:/hostroot:ro alpine sh
```

exit the container after.

```
docker run -d \
  --name test_all_risks \
  --privileged \
  --user 0 \
  --cap-add=SYS_ADMIN \
  --cap-add=SYS_PTRACE \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /:/hostroot:ro \
  -v /etc:/etc_host:ro \
  alpine sleep 3600
```

## Good to know

- How docker network works: <https://www.youtube.com/watch?v=bKFMS5C4CG0&list=WL&index=2&t=17s>
- Docker compose quick start: <https://docs.docker.com/compose/gettingstarted/>
- Trivy Github: <https://github.com/aquasecurity/trivy>
- Falco Github: <https://github.com/falcosecurity/falco>
- Falco documentation: <https://falco.org/docs/setup/container/>
- Flask tutorial: <https://www.geeksforgeeks.org/python/flask-tutorial/>
- Docker SDK: <https://docker-py.readthedocs.io/en/stable/>
- Threading in Python: <https://www.geeksforgeeks.org/python/multithreading-python-set-1/>
- Threading (YouTube): <https://www.youtube.com/watch?v=A_Z1lgZLSNc>
