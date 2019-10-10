# Author: yf-yang <directoryyf@gmail.com>

from flask import Blueprint, send_file
from flask_restplus import Api, Resource, fields
from ..utils import unknown_error_handler
from ..swagger import *
import os
import os.path as osp
from ..common import CACHE_DIR
from ..utils import clear_cache_dir
from .policy import generate
import zipfile

import logging
logger = logging.getLogger(__name__)

blueprint = Blueprint('exportation', __name__)

api = Api(
    blueprint, 
    doc='/help', 
    title="Net Configurator REST API Documentation: Exportation Opeartions",
    description=
        "This page offers documentations for exportation opeartions such as "
        "switch policies for ARL & ACL. "
        "For Intermediate JSON file generation, please refer to /help.",
    default="Policy Code Exportation",
    default_label= "Exportation APIs to generate switch policies",
)

error_message = api.model('ErrorMessage', ERROR_MESSAGE)

@api.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@api.response(500, RESPONSE_UNKNOWN_ERROR)
@api.route("")
class GenerateOpeation(Resource):
    @api.doc(
        description="Generate ARL & ACL codes for the topology.",
    )
    @unknown_error_handler
    def get(self):
        clear_cache_dir()
        generate()
        ZIPFILE = osp.join(CACHE_DIR, 'policies.zip')
        with zipfile.ZipFile(ZIPFILE, mode = 'w') as zf:
            for file in os.listdir(CACHE_DIR):
                if file.endswith('.json'):
                    zf.write(osp.join(CACHE_DIR, file))
        return send_file(ZIPFILE, as_attachment=True)