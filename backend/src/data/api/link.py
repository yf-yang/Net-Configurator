# Author: yf-yang <directoryyf@gmail.com>

from flask import jsonify, request
from flask_restplus import Resource, fields, Namespace
from ...utils import unknown_error_handler
from ...swagger import *
from .. import link

import logging
logger = logging.getLogger(__name__)

namespace = Namespace(
    'Link', 
    path='/link',
    description="Read, Create, Update, Delete operations for link entities."
)

LINK_ENTITY = {
    'linkID': fields.Raw(
        {}, 
        title='Data of a Link Entity', 
        description=
            "JSON object that represents a link."
            "See documentations of internal data.",
        example={
            "473b66a2211c4408843b575400af39c0": {
                "available_bandwidth": 1000,
                "endpoints": [
                    [
                        "61a02c10ed4f48b69c5a9c977d15e1f4",
                        "ETH-D2"
                    ],
                    [
                        "6f4037d832924c54a9d3bed7334acc3a",
                        "ETH_D4"
                    ]
                ],
                "protocol": "ETH"
            },
        }
    )
}
link_entity = namespace.model('LinkEntity', LINK_ENTITY)

PARTIAL_LINK_ENTITY = {
    'linkID': fields.Raw(
        {}, 
        title='Data of a Link Entity', 
        description=
            "JSON object that represents a link. Key 'available_bandwidth', "
            "'endpoints', 'protocol' should not appear since they are expected "
            "to be handled by backend itself. No key is mandatory. See "
            "documentations of internal data.",
    )
}
partial_link_entity = namespace.model('PartialLinkEntity', PARTIAL_LINK_ENTITY)

LINK_ENDPOINT = {
    "node": fields.String(
        title="Endpoint Node ID"
    ),
    "port": fields.String(
        title="Endpoint Port Name"
    )
}
link_endpoint = namespace.model('LinkEndpoint', LINK_ENDPOINT)

error_message = namespace.model('ErrorMessage', ERROR_MESSAGE)

@namespace.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@namespace.response(500, RESPONSE_UNKNOWN_ERROR)
@namespace.route('')
@namespace.doc(
    model=link_entity # success output (for response 200)
)
class LinkResource(Resource):
    @namespace.doc(
        description="Acquire data of all links."
    )
    @unknown_error_handler
    def get(self):
        """Acquire data of all links.

        Returns
        -------
        links: dict
            JSON object containing data of all links.
        """
        return jsonify(link)

    @namespace.doc(
        description=
            "Create a new link. "
            "At least two endpoints should be provided to create a link. "
            "All the endpoint ports should have the same protocol, which is "
            "then assigned to the link protocol. "
            "ETH links should have exactly 2 endpoints. "
            "At least one ETH link endpoint should be a switch."
            "For ETH link between switches, both endpoint ports should have "
            "exactly the same speed and port_type.",
        body=[link_endpoint], # JSON body
    )
    @unknown_error_handler
    def post(self):
        """Create a new link.

        Returns
        -------
        link : dict
            JSON object of the created link.
        """
        created = link.create(query=request.json, 
            **request.args.to_dict(flat=True))
        return jsonify(created)

@namespace.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@namespace.response(500, RESPONSE_UNKNOWN_ERROR)
@namespace.route('/<linkID>')
@namespace.doc(
    model=link_entity, # success output (for response 200)
    params={ # URL parameters
        'linkID': 'Internal ID for a link entity.'
    })
class LinkEntityResource(Resource):
    @namespace.doc(
        description="Acquire data of a link.",
    )
    @unknown_error_handler
    def get(self, linkID):
        """Acquire data of a link.

        Parameters
        ----------
        linkID : str
            ID of the link.

        Returns
        -------
        link : dict
            JSON object of the link.
        """
        return jsonify(link[linkID])

    @namespace.doc(
        description="Update data of a link.",
        body=partial_link_entity # JSON body
    )
    @unknown_error_handler
    def put(self, linkID):
        """Update data of a link.

        Parameters
        ----------
        linkID : str
            ID of the link.

        Returns
        -------
        link : dict
            JSON object of the link.
        """
        updated = link.update(query=request.json, target=linkID, 
            **request.args.to_dict(flat=True))
        return jsonify(updated)

    @namespace.doc(
        description="Reset data of a link or delete the link itself.",
        body=partial_link_entity # JSON body
    )
    @unknown_error_handler
    def delete(self, linkID):
        """Reset data of a link or delete the link itself.

        Parameters
        ----------
        linkID : str
            ID of the link.

        Returns
        -------
        link : dict or str
            JSON object of the link if some attributes are reset, linkID if the
            link is deleted.
        """
        deleted = link.delete(query=request.json, target=linkID, 
                **request.args.to_dict(flat=True))
        return jsonify(deleted)
