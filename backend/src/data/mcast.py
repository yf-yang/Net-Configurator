# Author: yf-yang <directoryyf@gmail.com>

from .base import SingletonDataManager
from .utils import wrap_exception, empty_query, dict_delete, dict_update
from .validator import MulticastGroupValidator, InitMulticastGroupValidator
from uuid import uuid4
import json
import os.path as osp

import logging 
logger = logging.getLogger(__name__)

class MulticastGroupManager(SingletonDataManager):
    """Manager of multicast group

    state is a dict of multicast group. Keys are group IDs. For more 
    information, please check the JSON schema.

    The class exposes methods of GET, CREATE, UPDATE and DELETE. All the WRITE 
    operations should be performed w.r.t. given methods, but READ operations are
    always allowed.
    """

    @wrap_exception
    def create(self, query):
        """ Create a multicast group.

        Parameters
        ----------
        query : dict
            Multicast group parameters.

        Returns
        -------
        info : dict
            A state dict of the multicast group.
        """
        # generate new ID
        logger.info("Generating new ID for the new multicast group")
        ID = uuid4().hex
        while ID in self._data:
            ID = uuid4().hex

        logger.info("Validating query")
        InitMulticastGroupValidator.validate(query)

        logger.info("Initialized multicast group %.8s from profile" % ID)
        configuration = query

        self._data[ID] = configuration
        logger.info("Created multicast group %.8s" % ID)

        return {ID: self._data[ID]}

    @wrap_exception
    def update(self, target, query):
        """ Update a multicast group.

        Parameters
        ----------
        target : str
            Target multicast group to be modified.
        
        query : dict
            New parameters of that muticast group.

        Returns
        -------
        Returns
        -------
        info : dict
            A state dict of the multicast group.
        """

        group = self._data[target]
        name = "multicast group %.8s" % target

        logger.info("Validating query")
        MulticastGroupValidator.validate(query)

        self._data[target] = dict_update(group, query, name)
        logger.info("Updated parameters above of %s" % name)

        return {target: self._data[target]}

    @wrap_exception
    def delete(self, target, query):
        """Delete a multicast group. or all multicast group.
        Parameters
        ----------
        target : str
            Target multicast group to be deleted.
            Supported targets are "all" to delete all multicast group and an ID
            to delete a specific multicast group.
        
        query : dict
            Supported queries are empty dict to delete the multicast group 
            itself and dict of keys that has value None to delete a specific key.

        Returns
        -------
        Returns
        -------
        info : str or dict
            UUID of the target deleted if the whole multicast group is deleted.
            A state dict of the multicast group if some parameters are cleared.
        """
        group = self._data[target]
        name = "multicast group %.8s" % target
        
        if query == {}:
            self._data.pop(target)
            logger.info("Deleted %s" % name)
            return target
        else:
            self._data[target] = dict_delete(group, query, name)
            logger.info("Cleared parameters above of %s" % name)
            return {target: self._data[target]}
