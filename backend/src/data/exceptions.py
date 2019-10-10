"""Exceptions for data accesses."""
# Author: yf-yang <directoryyf@gmail.com>

from ..exceptions import DataAccessError, BackendFatalError, BackendUserError

class NonStandardAccessError(DataAccessError, BackendFatalError):
    """Data Access that violates structure specification."""
    pass

class ProhibitedAccessError(DataAccessError, BackendFatalError):
    """Data Access that is prohibited (especially some WRITE accesses)."""
    pass

class WrongTypeAccessError(DataAccessError, BackendFatalError):
    """Data Access that raises TypeError."""
    pass

class InvalidAccessError(DataAccessError, BackendFatalError):
    """Data Access that raises KeyError or IndexError or FileNotFoundError."""
    pass

class WrongLinkError(DataAccessError, BackendUserError):
    """Error when trying to link two unmatched ports or device ports."""
    def __init__(self, msg, status="FAIL", *endpoints):
        super(WrongLinkError, self).__init__(msg, status)
        self.__endpoints = endpoints

    def _information(self):
        return {"endpoints": self.__endpoints}

class WrongNodeTypeError(DataAccessError, BackendFatalError):
    """Error when trying to create a non standard type node."""
    pass

class WrongBusTypeError(DataAccessError, BackendFatalError):
    """Error when trying to create a non standard bus type."""
    pass

class WrongTrafficTypeError(DataAccessError, BackendFatalError):
    """Error when trying to create a non standard type traffic."""
    pass

class CorruptFileError(DataAccessError, BackendUserError):
    """Error when imported file is unable to be read"""
    def __init__(self, msg, status="FAIL"):
        super(CorruptFileError, self).__init__(msg, status)