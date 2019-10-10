# Author: yf-yang <directoryyf@gmail.com>

from flask import Flask
from flask_cors import CORS
from .common import (
    sm,
    CACHE_DIR, session_key,
)
from .utils import unknown_error_handler, JSONEncoder
from . import exportation as exp
from . import importation as imp
from . import simulation as sim
from . import data
import atexit

import logging
logger = logging.getLogger(__name__)

app = Flask('app')
app.json_encoder = JSONEncoder
app.config.SWAGGER_UI_DOC_EXPANSION = 'list'
CORS(app, resources={r"*": {"origins": "*"}})

app.register_blueprint(data.blueprint)
app.register_blueprint(imp.blueprint, url_prefix='/import')
app.register_blueprint(sim.api, url_prefix='/simulate')
app.register_blueprint(exp.blueprint, url_prefix='/generate')

# logging upon exit
atexit.register(lambda: (
        logger.info("Net Configurator Session %s Shutdown\n" % session_key)))

logger.info("Net Convigurator Session %s Start" % session_key)