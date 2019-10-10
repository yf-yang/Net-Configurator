# Author: yf-yang <directoryyf@gmail.com>

from .base import SingletonDataManager
from .exceptions import (NonStandardAccessError, WrongNodeTypeError,
    WrongBusTypeError)
from .utils import (
    wrap_exception, empty_query, return_copy, dict_update, dict_delete)
from .validator import InitNodeValidator, NodeValidator
from uuid import uuid4
import json
import os.path as osp

import logging 
logger = logging.getLogger(__name__)

__NODE_TYPE__ = ("DEVICE", "SWITCH")
__PROTOCOL_TYPE__ = ("ETH",)

class NodeManager(SingletonDataManager):
    """ Manager of node.

    state is a dict of node. Keys are node IDs. A node could be either DEVICE or 
    Switch. For more information, please check the JSON schema.

    The class exposes methods of GET, UPDATE, CREATE and DELETE. All the WRITE 
    operations should be performed w.r.t. given methods, but READ operations are
    always allowed.
    """

    @wrap_exception
    def create(self, query,
            node_type=None, model=None):
        """ Create a node.

        Parameters
        ----------
        query : dict
            Node definition.

        node_type : str
            Type of the node. Supported types are "DEVICE" and 
            "SWITCH".

        model : None or str
            Model of the node. It should be a valid model name in the 
            corresponding profile.

        Returns
        -------
        info : dict
            A state dict of the node.
        """

        # generate new ID
        logger.info("Generating new ID for %s node" % node_type)
        ID = uuid4().hex
        while ID in self._data:
            ID = uuid4().hex

        if node_type not in __NODE_TYPE__:
            raise WrongNodeTypeError("Unknown node type %s" % node_type)
        
        if model is None:
            raise NonStandardAccessError("argument 'model' is missing")

        query.update({
            'type': node_type,
            'model': model
        })

        logger.info("Validating query and setting default values")
        InitNodeValidator.validate(query)

        logger.info("Initialized node %.8s from schema" % ID)
        configuration = query

        self._data[ID] = configuration
        logger.info("Created node %.8s" % ID)

        return {ID: self._data[ID]}

    @wrap_exception
    def update(self, target, query):
        """ Update a node.
        Modify one node at a time, but multiple ports could be modified 
        simultaneously.
        
        Parameters
        ----------
        target : str
            Target node to be modified.
        
        query : dict
            New parameters of that node.

        Returns
        -------
        info : dict
            A state dict of the node.
        """
        node = self._data[target]
        name = "%s node %.8s" % (node['type'], target)

        query.update({
            'type': node['type'],
            'model': node['model']
        })

        logger.info("Validating query")
        NodeValidator.validate(query)

        self._data[target] = dict_update(node, query, name)
        logger.info("Updated parameters above of %s" % name)

        return {target: self._data[target]}

    @wrap_exception
    def delete(self, target, query):
        """Delete a node. or all node.
        Parameters
        ----------
        target : str
            Target node to be deleted.
            Supported targets are "all" to delete all node and an ID to delete
            a specific node.

        query : dict
            Supported queries are empty dict to delete the node itself and dict 
            of keys that has value None to delete a specific key.

        Returns
        -------
        info : string or dict
            UUID of the target deleted if the whole node is deleted.
            A state dict of the node if some parameters are cleared.
        """
        node = self._data[target]
        name = "%s node %.8s" % (node['type'], target)
        
        if query == {}:
            self._data.pop(target)
            logger.info("Deleted %s" % name)
            return target
        else:
            self._data[target] = dict_delete(node, query, name)
            logger.info("Cleared parameters above of %s" % name)
            return {target: self._data[target]}

    @wrap_exception
    @return_copy
    def switches(self):
        """Acquire all switches.

        Returns
        -------
        switches : dict
            subset of internal state with type SWITCH.
        """
        return {k:v for k, v in self._data.items() 
                    if v["type"] == "SWITCH"}

    @wrap_exception
    @return_copy
    def devices(self):
        """Acquire all devices.

        Returns
        -------
        devices : dict
            subset of internal state with type DEVICE.
        """
        return {k:v for k, v in self._data.items() 
                    if v["type"] == "DEVICE"}



