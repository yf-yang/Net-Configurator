# Author: yf-yang <directoryyf@gmail.com>

from flask import jsonify, request
from flask_restplus import Resource, fields, Namespace
from ...utils import unknown_error_handler
from ...swagger import *
from .. import multicast_group

import logging
logger = logging.getLogger(__name__)

namespace = Namespace(
    'MulticastGroup', 
    path='/multicast_group',
    description="Read, Create, Update, Delete operations for multicast group"
    " entities."
)

MULTICAST_ENTITY = {
    'mgID': fields.Raw(
        {}, 
        title='Data of a Multicast Group Entity', 
        description=
            "JSON object that represents a multicast group."
            "See documentations of internal data.",
        example={
            "dc3bcf29193e48ffbc698a1315b86fc3": {
                "IP": "239.0.0.1",
                "MAC": "01:00:5E:00:00:01",
                "devices": [
                    "f300189684a74ba6942d82c170c4fea7",
                    "94fa678c78bd43619c87bf9fc328d1e8",
                    "a4bb9ea856094618997a3b6d235d2735"
                ]
            }
        }
    )
}
multicast_entity = namespace.model('MulticastEntity', MULTICAST_ENTITY)

PARTIAL_MULTICAST_ENTITY = {
    'mgID': fields.Raw(
        {}, 
        title='Data of a Multicast Group Entity', 
        description=
            "JSON object that represents a multicast group. No key is "
            "mandatory. See documentations of internal data.",
    )
}
partial_multicast_entity = namespace.model('PartialMulticastEntity', 
    PARTIAL_MULTICAST_ENTITY)

error_message = namespace.model('ErrorMessage', ERROR_MESSAGE)

@namespace.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@namespace.response(500, RESPONSE_UNKNOWN_ERROR)
@namespace.route('')
@namespace.doc(
    model=multicast_entity # success output (for response 200)
)
class MulticastResource(Resource):
    @namespace.doc(
        description="Acquire data of all multicast groups."
    )
    @unknown_error_handler
    def get(self):
        """Acquire data of all multicast groups.

        Returns
        -------
        multicast groups: dict
            JSON object containing data of all multicast groups.
        """
        return jsonify(multicast_group)

    @namespace.doc(
        description="Create a new multicast group.",
        body=partial_multicast_entity # JSON body
    )
    @unknown_error_handler
    def post(self):
        """Create a new multicast group.

        Returns
        -------
        multicast_group : dict
            JSON object of the created multicast group.
        """
        created = multicast_group.create(query=request.json, 
            **request.args.to_dict(flat=True))
        return jsonify(created)

@namespace.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@namespace.response(500, RESPONSE_UNKNOWN_ERROR)
@namespace.route('/<mgID>')
@namespace.doc(
    model=multicast_entity, # success output (for response 200)
    params={ # URL parameters
        'mgID': 'Internal ID for a multicast group entity.'
    })
class MulticastEntityResource(Resource):
    @namespace.doc(
        description="Acquire data of a multicast group.",
    )
    @unknown_error_handler
    def get(self, mgID):
        """Acquire data of a multicast group.

        Parameters
        ----------
        mgID : str
            ID of the multicast group.

        Returns
        -------
        multicast_group : dict
            JSON object of the multicast group.
        """
        return jsonify(multicast_group[mgID])

    @namespace.doc(
        description="Update data of a multicast group.",
        body=partial_multicast_entity # JSON body
    )
    @unknown_error_handler
    def put(self, mgID):
        """Update data of a multicast group.

        Parameters
        ----------
        mgID : str
            ID of the multicast group.

        Returns
        -------
        multicast_group : dict
            JSON object of the multicast group.
        """
        updated = multicast_group.update(query=request.json, target=mgID, 
            **request.args.to_dict(flat=True))
        return jsonify(updated)

    @namespace.doc(
        description=
            "Reset data of a multicast group or delete the multicast group "
            "itself.",
        body=partial_multicast_entity # JSON body
    )
    @unknown_error_handler
    def delete(self, mgID):
        """Reset data of a multicast group or delete the multicast group itself.

        Parameters
        ----------
        mgID : str
            ID of the multicast group.

        Returns
        -------
        multicast_group : dict or str
            JSON object of the multicast group if some attributes are reset, 
            mgID if the  multicast group is deleted.
        """
        deleted = multicast_group.delete(query=request.json, target=mgID, 
                **request.args.to_dict(flat=True))
        return jsonify(deleted)