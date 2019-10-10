# Author: yf-yang <directoryyf@gmail.com>

from flask import Blueprint, jsonify, request
from flask_restplus import Api, Resource, fields
from werkzeug.datastructures import FileStorage
from ..swagger import *
from ..utils import unknown_error_handler
from ..common import sm
from ..data.api import node, link, traffic, multicast_group
from .load import load

import logging
logger = logging.getLogger(__name__)

blueprint = Blueprint('importation', __name__)

api = Api(
    blueprint, 
    doc='/help', 
    title="Net Configurator REST API Documentation: Importation Opeartions",
    description=
        "This page offers documentations for OEM database file importation"
        "operations. "
        "For Intermediate JSON file importation, please refer to /help.",
    default="OEM Database Importation",
    default_label= "Importation APIs to load OEM database files.",
)

# copy the model definition from data api and register models here
node_entity = api.model('NodeEntity', node.NODE_ENTITY)
link_entity = api.model('LinkEntity', link.LINK_ENTITY)
traffic_entity = api.model('TrafficEntity', traffic.TRAFFIC_ENTITY)
multicast_entity = api.model('MulticastEntity', 
    multicast_group.MULTICAST_ENTITY)

INTERNAL_DATA = {
    'node': fields.Nested(node_entity),
    'link': fields.Nested(link_entity),
    'traffic': fields.Nested(traffic_entity),
    'multicast_group': fields.Nested(multicast_entity),
}
internal_data = api.model('InternalData', INTERNAL_DATA)

input_parser = api.parser()
input_parser.add_argument(
    'file', type=FileStorage, location='files', required=True)

error_message = api.model('ErrorMessage', ERROR_MESSAGE)

@api.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@api.response(500, RESPONSE_UNKNOWN_ERROR)
@api.route("")
@api.doc(
    model=internal_data # success output (for response 200)
)
class ImportOpeartion(Resource):
    @api.doc(
        description="Import an OEM database file into the backend.",
        body=input_parser
    )
    @unknown_error_handler
    def put(self):
        if "file" not in request.files:
            raise Exception
        file = request.files['file']
        load(file)
        return jsonify(sm)