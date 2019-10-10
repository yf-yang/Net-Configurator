# Author: yf-yang <directoryyf@gmail.com>

from .utils import read_only, return_copy, ProhibitedAccessError
import abc
from collections.abc import MutableMapping
from .singleton import Singleton

import logging
logger = logging.getLogger(__name__)

class BaseDataManager(MutableMapping, metaclass=abc.ABCMeta):
    """Base class for internal data managers.

    The class is a wrapper of internal data. The main purpose is to handle 
    WRITE operations, such as create, update and delete. All the WRITE 
    operations should be performed w.r.t. given methods, but READ operations
    are always allowed.

    Warning: This class should not be used directly.
    Use derived classes instead.
    """

    __slots__ = ('_data',)

    def __init__(self, data=None):
        """Initilize data.

        Parameters
        ----------
        data : dict or None
            internal data.

        State are given when loading from a saved configuration or imported
        from an OEM database.
        
        State would not be validated. Please validate it before invoking this
        initilizer.
        """
        class_name = self.__class__.__name__
        if data is None:
            self._data = {}
            logger.info("Initialize %s from empty data", class_name)
        elif len(data) is 0:
            self._data = data
            logger.info("Initialize %s from empty data", class_name)
        else:
            self._data = data
            logger.info("Initialize %s from provided data", class_name)

    def __len__(self): return len(self._data)

    @return_copy
    def __getitem__(self, key):
        if key in self._data:
            return self._data[key]
        if hasattr(self.__class__, "__missing__"):
            return self.__class__.__missing__(self, key)
        raise KeyError(key)

    def __setitem__(self, key, item):
        c = type(self).__name__
        raise ProhibitedAccessError("Can't add/modify items from %s. Please "
            "use %s.create method or %s.update method." % (c, c, c))

    def __delitem__(self, key):
        c = type(self).__name__
        raise ProhibitedAccessError("Can't delete items from %s. Please use "
            "%s.delete method." % (c, c))

    def __iter__(self):
        return iter(self._data)

    def __contains__(self, key):
        return key in self._data

    def __repr__(self): 
        return repr(self._data)

    @return_copy
    def as_dict(self):
        return self._data

    @abc.abstractmethod
    def create(self, *args, **kwargs):
        raise NotImplementedError

    @abc.abstractmethod
    def update(self, *args, **kwargs):
        raise NotImplementedError

    @abc.abstractmethod
    def delete(self, *args, **kwargs):
        raise NotImplementedError

class SingletonDataManager(BaseDataManager, metaclass=Singleton):
    pass