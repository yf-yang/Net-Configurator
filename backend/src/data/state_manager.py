# Author: yf-yang <directoryyf@gmail.com>

from .node import NodeManager
from .link import LinkManager
from .traffic import TrafficManager
from .mcast import MulticastGroupManager
from .singleton import Singleton
from .utils import read_only
from .exceptions import InvalidAccessError

import logging
logger = logging.getLogger(__name__)

from ..common import DATA_TYPES

def private(attr):
    return '_' + attr

class StateManager(metaclass=Singleton):
    """Manager of internal state.

    This class is exposed to the backend as the inner data structure. All the 
    sub-class are wrapped inside to be protected. It exposes methods of GET,
    UPDATE, CREATE and DELETE, and assign each query to the specific class. All 
    the WRITE operations should be performed w.r.t. given methods, but READ
    operations are always allowed.
    """
    __DATA_TYPES__ = DATA_TYPES
    __slots__ = __DATA_TYPES__ + tuple(private(dt) for dt in __DATA_TYPES__)

    def __init__(self, state=None):
        """Initilize internal state.

        Parameters
        ----------
        state : dict
            States to initilize the internal state.

        States are given when loading from a saved configuration or imported
        from an OEM database.
        
        States would not be validated. Please validate it before invoking this
        initilizer.
        """

        # superclass __init__ is overwritten
        if state is None or len(state) is 0:
            logger.info("Initialize StateManager from empty state")
            self._node = NodeManager()
            self._link = LinkManager()
            self._traffic = TrafficManager()
            self._multicast_group = MulticastGroupManager()

        else:
            logger.info("Initialize StateManager from provided state")
            self._node = NodeManager(data=state.get("node", None))
            self._link = LinkManager(data=state.get("link", None))
            self._traffic = TrafficManager(
                data=state.get("traffic", None))
            self._multicast_group = MulticastGroupManager(
                data=state.get("multicast_group", None))
            
    def create(self, data_type, **kwargs):
        """Create new data instance according to the query.

        Create one instance at a time. 

        Parameters
        ----------
        data_type : string
            The type of the instance to be created. 
        
        kwargs : dict
            kwargs should always contain an argument [query]
                Json query of multiple delete operations.

        Returns
        -------
        ID : string
            UUID of the target created.
        """
        if data_type not in self.__DATA_TYPES__:
            raise InvalidAccessError("Unknown data type %s" % data_type)
        else:
            return getattr(self, data_type).create(**kwargs)

    def update(self, data_type, target, **kwargs):
        """Update new data instance according to the query.

        Update one instance at a time. 

        Parameters
        ----------
        data_type : string
            The type of the instance to be updated.

        target : str or int
            Key or index of the instance to be updated.

        kwargs : dict
            kwargs should always contain an argument [query]
                Json query of multiple delete operations.

        Returns
        -------
        ID : string
            UUID of the target updated.
        """
        if data_type not in self.__DATA_TYPES__:
            raise InvalidAccessError("Unknown data type %s" % data_type)
        else:
            return getattr(self, data_type).update(target=target, **kwargs)

    def delete(self, data_type, target, **kwargs):
        """Delete new data data_type according to the query.

        Update one instance at a time. 

        Parameters
        ----------
        data_type : string
            The type of the instance to be deleted.

        target : str or int
            Key or index of the instance to be deleted.

        kwargs : dict
            Kwargs should always contain an argument [query]
                Json query of multiple delete operations.

        Returns
        -------
        ID : string
            UUID of the target deleted.
        """
        if data_type not in self.__DATA_TYPES__:
            raise InvalidAccessError("Unknown data type %s" % data_type)
        return getattr(self, data_type).delete(target=target, **kwargs)

    def as_dict(self):
        return {
            dt: getattr(self, dt).as_dict() for dt in self.__DATA_TYPES__
        }

    def __getattr__(self, key):
        if key in self.__DATA_TYPES__:
            return getattr(self, private(key))
        else:
            raise InvalidAccessError("Unable to acquire attribute '%s' of %s"
                % (key, type(self).__name__))
