"""Exceptions for importations."""
# Author: yf-yang <directoryyf@gmail.com>

from ..exceptions import ImportationError, BackendFatalError, BackendUserError

class UnsupportedExtensionError(ImportationError, BackendUserError):
    """Error when imported file is not supported"""
    def __init__(self, msg, status="FAIL"):
        super(UnsupportedExtensionError, self).__init__(msg, status)


class FileLoadError(ImportationError, BackendUserError):
    """Error when imported file is not supported"""
    def __init__(self, msg, status="FAIL"):
        super(FileLoadError, self).__init__(msg, status)