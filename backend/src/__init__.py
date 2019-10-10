# Author: yf-yang <directoryyf@gmail.com>

import traceback as tb

try:
    from .app import app
except ModuleNotFoundError:
    tb.print_exc()
    print()
    print("Try to run `docker-compose build backend` before starting the "
        "container.")
    exit(1)