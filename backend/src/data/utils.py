# Author: yf-yang <directoryyf@gmail.com>

from functools import wraps
from .exceptions import (ProhibitedAccessError, InvalidAccessError,
    WrongTypeAccessError, NonStandardAccessError, CorruptFileError)
from copy import deepcopy
import json
import hashlib
import sys
from ..utils import JSONEncoder

import logging
logger = logging.getLogger(__name__)

# Is it a good idea? I am not sure if we should strictly set it to UTF-8
ENCODING = sys.getdefaultencoding()

hash_fun = hashlib.sha256

def pack(state_manager):
    jstring = json.dumps(state_manager, sort_keys=True, cls=JSONEncoder)
    return {
        "checksum": hash_fun(jstring.encode(ENCODING)).hexdigest(),
        "data": jstring
    }

def unpack(jobject, checksum=True):
    """Check file is not modified and remove checksum

    Parameters
    ----------
    jobject : dict
        Dict to be unpacked. It should contain a key "checksum" if argument
        "checksum" is True.

    checksum : bool
        Whether or not check the checksum of given file.

    Returns
    -------
    jobject : dict
        Dict without checksum key.

    Raises
    ------
    CorruptFileError
        If the jobject is modified unexpectedly.
    """
    if not isinstance(jobject, dict):
        raise CorruptFileError("Expect a dict input, got %s"
            % jobject.__class__.__name__)

    if checksum and "checksum" not in jobject:
        raise CorruptFileError("Checksum is required but missing")

    # compute the checksum
    if checksum:
        # get the checksum and remove it from jobject
        cs = jobject.pop("checksum")
        jstring = jobject.pop("data")
        if cs != hash_fun(jstring.encode(ENCODING)).hexdigest():
            raise CorruptFileError("File has been modified unexpectedly.")
    return json.loads(jstring)



def dict_update(raw, new, prefix):
    """Update a dict recursively.

    Parameters
    ----------
    raw : dict
        Dict to be updated.

    new : dict
        Dict contains new information.

    prefix : str
        Name prefix for logging.
    """
    # Here we want to modify the state until all the update is valid, so we
    # would make a shallow copy here. We can use shallow copy instead of deep
    # copy here because dict are updated recursively and lists are treated as a
    # whole. If that condition is violated, we may need a deepcopy version
    raw_copy = raw.copy()
    for k, v in new.items():
        name = '%s->%s' % (prefix, k)
        if k not in raw_copy:
            raise InvalidAccessError("Unknown parameter %s" % k)
        elif not _is_type_equal(raw_copy[k], v):
            raise InvalidAccessError("Unable to update %s, expect %s but got %s" 
                %(name, raw_copy[k].__class__.__name__, v.__class__.__name__))
        elif isinstance(raw_copy[k], dict):
            raw_copy[k] = dict_update(raw_copy[k], v, name)
        else:
            raw_copy[k] = v

        logger.info("Able to update %s" % name)
    return raw_copy

def dict_delete(raw, query, prefix):
    """Update a dict recursively.

    Parameters
    ----------
    raw : dict
        Dict to be updated.

    query : dict
        Entries to be deleted.

    prefix : str
        Name prefix for logging.
    """
    # Here we want to modify the state until all the update is valid, so we
    # would make a shallow copy here. We can use shallow copy instead of deep
    # copy here because dict are updated recursively and lists are treated as a
    # whole. If that condition is violated, we may need a deepcopy version
    raw_copy = raw.copy()
    for k, v in query.items():
        name = '%s->%s' % (prefix, k)
        if k not in raw_copy:
            raise InvalidAccessError("Unable to delete %s, key not found" 
                % (name, k))
        if v is None:
            if isinstance(raw_copy[k], list):
                raw_copy[k] = []
            elif isinstance(raw_copy[k], dict):
                raise NonStandardAccessError("Unable to delete %s. Expect a "
                    "but got NoneType" % name)
            else:
                raw_copy[k] = None
        elif isinstance(raw_copy[k], dict):
            raw_copy[k] = dict_delete(raw_copy[k], v, name)
        else:
            raise NonStandardAccessError("Value should be NoneType or dict")

        logger.info("Able to delete %s" % name)

    return raw_copy

def read_only(getter):
    """Read-only decorator

    Works exactly the same as @property, but raises ProhibitedAccessError.

    Parameters
    ---------
    getter : a callable object / function with signature getter(obj)

    Returns
    -------
    property : read-only property of the class
    """
    property_name = getter.__name__

    @wraps(getter)
    def setter(obj, _):
        raise ProhibitedAccessError("Unable to modify %s.%s. Nothing changes" 
            % (type(obj).__name__, property_name))
    @wraps(getter)
    def deleter(obj):
        raise ProhibitedAccessError("Unable to delete %s.%s. Nothing changes" 
            % (type(obj).__name__, property_name))
    return property(getter, setter, deleter)

def wrap_exception(f):
    """Decorator to wrap exceptions during access as NonStandardAccessError.

    Parameters
    __________
    f : a callable object / function

    Returns
    -------
    exception_handler : a callable object / function
        Handler that wraps other exception with NonStandardAccessError or return
        what f is expected to return.
    """
    @wraps(f)
    def exception_handler(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except (KeyError, IndexError, FileNotFoundError) as e:
            raise InvalidAccessError from e
        except TypeError as e:
            raise WrongTypeAccessError from e
 
    return exception_handler

def return_copy(f):
    """Decorator to wrap return values of f with deepcopy.
    
    Return deepcopy to avoid violations of write protection of a piece of data.

    Parameters
    __________
    f : a callable object / function

    Returns
    -------
    deepcopy_wrapper : a callable object / function
        Wrapper that return a deepcopy of what f returns.
    """
    @wraps(f)
    def deepcopy_wrapper(*args, **kwargs):
        return deepcopy(f(*args, **kwargs))
    return deepcopy_wrapper

def empty_query(f):
    """Decorator to assert empty query in a method call.

    This decorator should only wrap methods!!!

    Parameters
    __________
    f : a callable object / function with argument [query]

    Returns
    -------
    query_checker :  a callable object / function
        Wrapper that checks f has argument query and the given query is empty.
    """
    @wraps(f)
    def query_checker(self, *args, **kwargs):
        freturn = f(self, *args, **kwargs)

        fname = '.'.join((self.__class__.__name__, f.__name__))
        if "query" not in kwargs:
            raise WrongTypeAccessError("Function %s expects keyword argument "
                "[query], otherwise do not use empty_query decorator! "
                "Operation is still successful but nothing will be returned" 
                % fname)

        if len(kwargs["query"]) is not 0:
            raise NonStandardAccessError("Function %s expects an empty query. "
                "Operation is still successful but nothing will be returned" 
                % fname)

        return freturn
    return query_checker

def _is_type_equal(X, Y):
    if X is None:
        return True
    if Y is None:
        return True
    return type(X) == type(Y)
