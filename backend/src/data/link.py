# Author: yf-yang <directoryyf@gmail.com>

from .base import SingletonDataManager
from .exceptions import (NonStandardAccessError, WrongLinkError, 
    ProhibitedAccessError)
from .utils import wrap_exception, dict_delete, empty_query
from uuid import uuid4
from collections import namedtuple
import logging
logger = logging.getLogger(__name__)

# Namedtuple to store a node ID - port ID pair
EndPoint = namedtuple("EndPoint", "node port")

class LinkManager(SingletonDataManager):
    """Manager of link.

    state is a dict of link. Keys are link IDs. For more information, please 
    check the JSON schema.

    The class exposes methods of GET, CREATE, UPDATE and DELETE. All the WRITE 
    operations should be performed w.r.t. given methods, but READ operations are
    always allowed.

    Note that UPDATE operation for ETH link is prohibited.
    """

    @wrap_exception
    def create(self, query):
        """Create a link.

        Parameters
        ----------
        query : list
            [{"node": str, "port": str}]
            Endpoint ports of a link.

            An ETH link should have exactly two endpoints.

        Returns
        -------
        info : dict
            A state dict of the link.
        """
        endpoints = {EndPoint(**ep) for ep in query}

        from ..common import node

        if len(endpoints) != 2:
            raise WrongLinkError("Expect 2 endpoints for ETH link but got "
                "%d" % len(endpoints), "FAIL")
        switch_eps = [
            ep for ep in endpoints if node[ep.node]["type"] == "SWITCH"
        ]

        # At least one switch port should be present
        if len(switch_eps) == 0:
            raise WrongLinkError("Unable to create link between two DEVICEs",
                "FAIL", *endpoints)
        # If there are multiple switches, they should be the same
        elif len(switch_eps) == 2:
            x, y = [node[ep.node]["ports"][ep.port] for ep in switch_eps]
            if (x["port_type"] != y["port_type"] or
                x["available_bandwidth"] != y["available_bandwidth"]):
                raise WrongLinkError("Link couldn't be established. Make "
                    "sure port type and bandwidth are exactly the same",
                    "FAIL", *endpoints)

        ep = switch_eps[0]
        port = node[ep.node]["ports"][ep.port]
        available_bandwidth = port["available_bandwidth"]

        # generate new ID
        logger.info("Generating new ID for link between node %s and node %s"
                        % tuple(ep.node for ep in endpoints))
        ID = uuid4().hex
        while ID in self._data:
            ID = uuid4().hex

        # establish link
        self._data[ID] = {
            "endpoints": list(endpoints),
            "available_bandwidth": available_bandwidth
        }
        logger.info("Created link %.8s" % ID)

        return {ID: self._data[ID]}

    @wrap_exception
    @empty_query
    def update(self, target, query):
        """ Prohibited interface.
        For ETH link, since they have exactly two endpoints, they should be 
        directly removed instead of invoking this method.
        """

        raise ProhibitedAccessError("ETH Links are not allowed to be updated, "
            "because they are not configurable. Please delete a link then "
                "create a new one to perform an update")

    @wrap_exception
    @empty_query
    def delete(self, target, query):
        """Delete a link or all link.

        Parameters
        ----------
        target : str
            Target link ID to be deleted.

        query : dict
            Supported queries are empty dict to delete the link itself and dict 
            of keys that has value None to delete a specific key.

        Returns
        -------
        info : string
            UUID of the target deleted.
        """
        link = self._data[target]
        name = "link %.8s" % target
        
        if query == {}:
            self._data.pop(target)
            logger.info("Deleted %s" % name)
            return target
        else: # useless now but may be useful later
            self._data[target] = dict_delete(self._data, query, prefix=name)
            logger.info("Cleared parameters above of %s" % name)
            return {target: self._data[target]}
