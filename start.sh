#!/usr/bin/env bash
# Start Turnstile Solver inside a virtual 1080p X framebuffer
exec xvfb-run -a --server-args="-screen 0 1920x1080x24 -ac" node Turnstile_Solver.js "$@"

