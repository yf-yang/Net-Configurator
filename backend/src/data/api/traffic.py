# Author: yf-yang <directoryyf@gmail.com>

from flask import jsonify, request
from flask_restplus import Resource, fields, Namespace
from ...utils import unknown_error_handler
from ...swagger import *
from .. import traffic

import logging
logger = logging.getLogger(__name__)

namespace = Namespace(
    'Traffic', 
    path='/traffic',
    description="Read, Create, Update, Delete operations for traffic entities."
)

TRAFFIC_ENTITY = {
    'trafficID': fields.Raw(
        {}, 
        title='Data of a Traffic Entity', 
        description=
            "JSON object that represents a traffic flow."
            "See documentations of internal data.",
        example={
            "80ae6a4b9cd54def99718e0be85bb17e": {
                "bandwidth": 50,
                "destination": {
                    "device": "f13296a540ef47788ab2bc6092f6338a",
                    "address_method": "UNICAST",
                    "multicast_group": None,
                    "port": 50000
                },
                "max_jitter": 10,
                "max_latency": 25,
                "name": "LidarFR",
                "priority": 6,
                "protocol": "UDP",
                "source": {
                    "device": "7dc9f7901baf4b5f9e2e6b78fca53634",
                    "port": None
                },
                "type": "IP"
            },
        }
    )
}
traffic_entity = namespace.model('TrafficEntity', TRAFFIC_ENTITY)

PARTIAL_TRAFFIC_ENTITY = {
    'trafficID': fields.Raw(
        {}, 
        title='Data of a Traffic Entity', 
        description=
            "JSON object that represents a traffic flow. Key 'type' should not "
            "appear since they are expected to be handled by backend itself. "
            "No key is mandatory. See documentations of internal data.",
    )
}
partial_traffic_entity = namespace.model('PartialTrafficEntity', 
    PARTIAL_TRAFFIC_ENTITY)

error_message = namespace.model('ErrorMessage', ERROR_MESSAGE)

@namespace.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@namespace.response(500, RESPONSE_UNKNOWN_ERROR)
@namespace.route('')
@namespace.doc(
    model=traffic_entity # success output (for response 200)
)
class TrafficResource(Resource):
    @namespace.doc(
        description="Acquire data of all traffic flows."
    )
    @unknown_error_handler
    def get(self):
        """Acquire data of all traffic.

        Returns
        -------
        traffic: dict
            JSON object containing data of all traffic.
        """
        return jsonify(traffic)

    @namespace.doc(
        description="Create a new traffic flow.",
        params={ # request arguments
            "traffic_type": 
                "'IP'. Type of Traffic. See documentations of internal data.",
        },
        body=partial_traffic_entity # JSON body
    )
    @unknown_error_handler
    def post(self):
        """Create a new traffic flow.

        Returns
        -------
        traffic : dict
            JSON object of the created traffic.
        """
        created = traffic.create(query=request.json, 
            **request.args.to_dict(flat=True))
        return jsonify(created)

@namespace.response(400, RESPONSE_EXPECTED_ERROR, [error_message])
@namespace.response(500, RESPONSE_UNKNOWN_ERROR)
@namespace.route('/<trafficID>')
@namespace.doc(
    model=traffic_entity, # success output (for response 200)
    params={ # URL parameters
        'trafficID': 'Internal ID for a traffic entity.'
    })
class TrafficEntityResource(Resource):
    @namespace.doc(
        description="Acquire data of a traffic flow.",
    )
    @unknown_error_handler
    def get(self, trafficID):
        """Acquire data of a traffic flow.

        Parameters
        ----------
        trafficID : str
            ID of the traffic.

        Returns
        -------
        traffic : dict
            JSON object of the traffic.
        """
        return jsonify(traffic[trafficID])

    @namespace.doc(
        description="Update data of a traffic flow.",
        body=partial_traffic_entity # JSON body
    )
    @unknown_error_handler
    def put(self, trafficID):
        """Update data of a traffic flow.

        Parameters
        ----------
        trafficID : str
            ID of the traffic.

        Returns
        -------
        traffic : dict
            JSON object of the traffic.
        """
        updated = traffic.update(query=request.json, target=trafficID, 
            **request.args.to_dict(flat=True))
        return jsonify(updated)

    @namespace.doc(
        description=
            "Reset data of a traffic flow or delete the traffic flow itself.",
        body=partial_traffic_entity # JSON body
    )
    @unknown_error_handler
    def delete(self, trafficID):
        """Reset data of a traffic flow or delete the traffic flow itself.

        Parameters
        ----------
        trafficID : str
            ID of the traffic.

        Returns
        -------
        traffic : dict or str
            JSON object of the traffic if some attributes are reset, trafficID 
            if the traffic is deleted.
        """
        deleted = traffic.delete(query=request.json, target=trafficID, 
                **request.args.to_dict(flat=True))
        return jsonify(deleted)

