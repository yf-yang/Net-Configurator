# Author: yf-yang <directoryyf@gmail.com>

from .base import SingletonDataManager
from .exceptions import NonStandardAccessError, WrongTrafficTypeError
from .validator import TrafficValidator, InitTrafficValidator
from .utils import (
    wrap_exception, empty_query, return_copy, dict_delete, dict_update)
import json
import os.path as osp
from uuid import uuid4

import logging 
logger = logging.getLogger(__name__)

__TRAFFIC_TYPE__ = ("IP",)

class TrafficManager(SingletonDataManager):
    """Manager of traffic

    state is a dict of traffic. Keys are group IDs. For more 
    information, please check the JSON schema.

    The class exposes methods of GET, CREATE, UPDATE and DELETE. All the WRITE 
    operations should be performed w.r.t. given methods, but READ operations are
    always allowed.
    """

    @wrap_exception
    def create(self, query, traffic_type=None):
        """ Create a traffic.

        Parameters
        ----------
        query : dict
            Traffic parameters.

        traffic_type : None or str
            Type of the traffic. Supported types are "IP" for a normal L3 
            traffic.

        Returns
        -------
        info : dict
            A state dict of the traffic.
        """

        # generate new ID
        logger.info("Generating new ID for %s traffic" % traffic_type)
        ID = uuid4().hex
        while ID in self._data:
            ID = uuid4().hex

        if traffic_type not in __TRAFFIC_TYPE__:
            raise WrongTrafficTypeError("Unknown traffic type %s." 
                % traffic_type)

        query.update({
            'type': traffic_type
        })

        logger.info("Validating query")
        InitTrafficValidator.validate(query)

        logger.info("Initialized traffic %.8s from schema" % ID)
        configuration = query

        self._data[ID] = configuration
        logger.info("Created traffic %.8s" % ID)

        return {ID: self._data[ID]}

    @wrap_exception
    def update(self, target, query):
        """ Update a traffic.

        Parameters
        ----------
        target : str
            Target traffic to be modified.
        
        query : dict
            New parameters of that muticast group.

        Returns
        -------
        info : dict
            A state dict of the traffic.
        """
        traffic = self._data[target]
        name = "%s traffic %.8s" % (traffic['type'], target)

        query.update({
            'type': traffic['type'],
        })

        if 'destination' not in query:
            query.update({
                'destination': {}   
            })

        query['destination'].update({
                'address_method': traffic['destination']['address_method']
            }
        )
            

        logger.info("Validating query")
        TrafficValidator.validate(query)

        self._data[target] = dict_update(traffic, query, name)
        logger.info("Updated parameters above of %s" % name)

        return {target: self._data[target]}

    @wrap_exception
    def delete(self, target, query):
        """Delete a traffic. or all traffic.
        Parameters
        ----------
        target : str
            Target traffic to be deleted.
            Supported targets are "all" to delete all traffic and an ID
            to delete a specific traffic.

        query : dict
            Supported queries are empty dict to delete the multicast group itself 
            and dict of keys that has value None to delete a specific key.

        Returns
        -------
        info : str or dict
            UUID of the target deleted if the whole traffic is deleted.
            A state dict of the traffic if some parameters are cleared.
        """
        traffic = self._data[target]
        name = "%s traffic %.8s" % (traffic['type'], target)
        
        if query == {}:
            self._data.pop(target)
            logger.info("Deleted %s" % name)
            return target
        else:
            self._data[target] = dict_delete(traffic, query, name)
            logger.info("Cleared parameters above of %s" % name)
            return {target: self._data[target]}