# Author: yf-yang <directoryyf@gmail.com>

from flask import jsonify, request
from flask_restplus import Resource, fields, Namespace
from ...utils import unknown_error_handler
from ...swagger import *
from .. import node

import logging
logger = logging.getLogger(__name__)

namespace = Namespace(
    'Node', 
    path='/node',
    description="Read, Create, Update, Delete operations for node entities."
)

NODE_ENTITY = {
    'nodeID': fields.Raw(
        {}, 
        title='Data of a Node Entity', 
        description=
            "JSON object that represents a device or switch."
            "See documentations of internal data.",
        example={
            "type": "SWITCH",
            "protocol": "ETH",
            "category": "SWMODEL1",
            "name": "Example Switch",
            "IP": "192.168.80.01",
            "MAC": "02:00:00:80:00:01",
            "ports": {
                "ETH_A1": {
                    "available_bandwidth": 10000,
                    "port_bit": 0,
                    "port_type": "10GBASE-T",
                    "protocol": "ETH"
                },
                "ETH_A2": {
                    "available_bandwidth": 10000,
                    "port_bit": 1,
                    "port_type": "10GBASE-T",
                    "protocol": "ETH"
                },
            },
        }
    )
}
node_entity = namespace.model('NodeEntity', NODE_ENTITY)

PARTIAL_NODE_ENTITY = {
    'nodeID': fields.Raw(
        {}, 
        title='Data of a Node Entity', 
        description=
            "JSON object that represents a device or switch. Key 'type', "
            "'subtype', 'protocol', 'category', 'ports' should not appear "
            "since they are expected to be handled by backend itself. No key is"
            " mandatory. See documentations of internal data.",
    )
}
partial_node_entity = namespace.model('PartialNodeEntity', PARTIAL_NODE_ENTITY)

error_message = namespace.model('ErrorMessage', ERROR_MESSAGE)

@namespace.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@namespace.response(500, RESPONSE_UNKNOWN_ERROR)
@namespace.route('')
@namespace.doc(
    model=node_entity # success output (for response 200)
)
class NodeResource(Resource):
    @namespace.doc(
        description="Acquire data of all nodes."
    )
    @unknown_error_handler
    def get(self):
        """Acquire data of all nodes.

        Returns
        -------
        nodes: dict
            JSON object containing data of all nodes.
        """
        return jsonify(node)

    @namespace.doc(
        description="Create a new node.",
        params={ # request arguments
            "node_type": 
                "'DEVICE' or 'SWITCH'. Type of Node. "
                "See documentations of internal data.",
            "model": 
                "Model of switch or device. See documentations of internal "
                "data."
        },
        body=partial_node_entity # JSON body
    )
    @unknown_error_handler
    def post(self):
        """Create a new node.

        Returns
        -------
        node : dict
            JSON object of the created node.
        """
        created = node.create(query=request.json, 
            **request.args.to_dict(flat=True))
        return jsonify(created)

@namespace.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@namespace.response(500, RESPONSE_UNKNOWN_ERROR)
@namespace.route('/<nodeID>')
@namespace.doc(
    model=node_entity, # success output (for response 200)
    params={ # URL parameters
        'nodeID': 'Internal ID for a node entity.'
    })
class NodeEntityResource(Resource):
    @namespace.doc(
        description="Acquire data of a node.",
    )
    @unknown_error_handler
    def get(self, nodeID):
        """Acquire data of a node.

        Parameters
        ----------
        nodeID : str
            ID of the node.

        Returns
        -------
        node : dict
            JSON object of the node.
        """
        return jsonify(node[nodeID])

    @namespace.doc(
        description="Update data of a node.",
        body=partial_node_entity # JSON body
    )
    @unknown_error_handler
    def put(self, nodeID):
        """Update data of a node.

        Parameters
        ----------
        nodeID : str
            ID of the node.

        Returns
        -------
        node : dict
            JSON object of the node.
        """
        updated = node.update(query=request.json, target=nodeID, 
            **request.args.to_dict(flat=True))
        return jsonify(updated)

    @namespace.doc(
        description="Reset data of a node or delete the node itself.",
        body=partial_node_entity # JSON body
    )
    @unknown_error_handler
    def delete(self, nodeID):
        """Reset data of a node or delete the node itself.

        Parameters
        ----------
        nodeID : str
            ID of the node.

        Returns
        -------
        node : dict or str
            JSON object of the node if some attributes are reset, nodeID if the
            node is deleted.
        """
        deleted = node.delete(query=request.json, target=nodeID, 
                **request.args.to_dict(flat=True))
        return jsonify(deleted)
