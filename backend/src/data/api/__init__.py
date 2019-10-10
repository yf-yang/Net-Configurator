# Author: yf-yang <directoryyf@gmail.com>

from flask import Blueprint, request, jsonify
from flask_restplus import Api, Resource, fields
from ...swagger import *
from ...utils import unknown_error_handler
from ..utils import pack, unpack
from . import node
from . import link
from . import traffic
from . import multicast_group
from .. import sm, StateManager
from ..validator import schema_tree

import logging
logger = logging.getLogger(__name__)

blueprint = Blueprint('data', __name__)
api = Api(
    blueprint, 
    doc='/help', 
    title="Net Configurator REST API Documentation: CRUD Opeartions",
    description=
        "This page offers documentations for fundamental internal data"
        "operations, including Create, Read, Update and Delete (CRUD). All the "
        "WRITE opertions to the internal data should be executed with respect "
        "to standard Create, Update and Delete operations (and import "
        "operations) to assure the correctness of internal data.",
    default="Fundamental Opeations",
    default_label= "Fundamental Read & Write Data Opeartions REST APIs",
)

api.add_namespace(node.namespace)
api.add_namespace(link.namespace)
api.add_namespace(traffic.namespace)
api.add_namespace(multicast_group.namespace)

error_message = api.model('ErrorMessage', ERROR_MESSAGE)

INTERNAL_DATA = {
    'node': fields.Nested(node.node_entity),
    'link': fields.Nested(link.link_entity),
    'traffic': fields.Nested(traffic.traffic_entity),
    'multicast_group': fields.Nested(multicast_group.multicast_entity),
}
internal_data = api.model('InternalData', INTERNAL_DATA)

OUTPUT_JSON = {
    "checksum": fields.String(),
    "data": fields.String(
        description="String of internal data JSON object."
    ),
}
output_json = api.model('OutputJson', OUTPUT_JSON)

@api.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@api.response(500, RESPONSE_UNKNOWN_ERROR)
@api.route('/all')
@api.route('/')
@api.doc(
    model=internal_data # success output (for response 200)
)
class AllResource(Resource):
    @api.doc(
        description=
            "Acquire all the internal data as a JSON object with key 'node', "
            "'link', 'traffic' and 'multicast_group', each key maps to JSON "
            "object of all entities of the type."
    )
    @unknown_error_handler
    def get(self):
        """
        Acquire all the internal data.

        Returns
        ---------
        state: dict
            A JSON object with key 'node', 'link', 'traffic' and 
            'multicast_group', each key maps to JSON object of all entities of 
            the type.
        """
        return jsonify(sm)

@api.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@api.response(500, RESPONSE_UNKNOWN_ERROR)
@api.route('/dump')
@api.doc(
    model=output_json # success output (for response 200)
)
class DumpOperation(Resource):
    @api.doc(
        description=
            "Dump internal data to a JSON object with checksum to save to the "
            "disk. The JSON object should not be modified anywhere outside the "
            "Net Configurator."
    )
    @unknown_error_handler
    def get(self):
        jobject_with_checksum = pack(sm)
        return jsonify(jobject_with_checksum)

@api.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@api.response(500, RESPONSE_UNKNOWN_ERROR)
@api.route('/load')
@api.doc(
    model=internal_data # success output (for response 200)
)
class LoadOperaion(Resource):
    @api.doc(
        description=
            "Load intermediate JSON output from disk."
            "The JSON object should match the checksum to assure it is not "
            "modified anywhere outside the Net Configurator."
    )
    @unknown_error_handler
    def put(self):
        if request.json is None:
            jobject = None
        else:
            jobject = unpack(request.json)
        return jsonify(StateManager(state=jobject))

def find_schema(obj):
    """Iteratively find schema object and replace them with default values.
    """
    for k, v in obj.items():
        if isinstance(v, dict):
            if '$schema' in v:
                obj[k] = default_values(v)
                obj[k]['$schema'] = v['$schema']
            else:
                obj[k] = find_schema(v)
        else:
            raise Exception
    return obj

def default_values(schema_obj):
    if 'default' in schema_obj:
        return schema_obj['default']
    else:
        default_obj = {}
        for k, v in schema_obj['properties'].items():
            if v.get('type', None) == 'object':
                default_obj[k] = default_values(v)
            else:
                if 'enum' in v :
                    default_obj[k] = v['enum']
                elif 'default' in v:
                    default_obj[k] = v['default']
                elif 'oneOf' in v:
                    default_obj[k] = [
                        default_values(obj) for obj in v['oneOf']
                    ]
        return default_obj

@api.route('/profile')
class ProfileResource(Resource):
    @api.doc(
        description=
        "Acquire default values for each data type."
    )
    @unknown_error_handler
    def get(self):
        # Iteratively find schemas
        return jsonify(
            find_schema(schema_tree)
        )
