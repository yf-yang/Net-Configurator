"""Backend-wide exceptions. Expected to be used as Abstract Classes!"""
# Author: yf-yang <directoryyf@gmail.com>

class BackendError(Exception):
    """Base class for exceptions in the backend."""
    error_type = "unknown"

class BackendFatalError(BackendError):
    """Base class for exceptions caused by either frontend or backend.
    For debugging between frontend and backend only.
    These exceptions shouldn't occur during deployment.
    """
    pass

# map string status to bool
__STATUS_MAP__ = {
    "FAIL": False,
    "SUCCESS": True,
}
class BackendUserError(BackendError):
    """Base class for exceptions caused by invalid user input or operations.
    These exceptions should be reported to the application user.
    Error details such as operation information should be provided.
    """
    def __init__(self, msg, status):
        """
        Parameters
        ----------
        msg : str
            Error message.
        status : str
            Status of the operation. Supported statuses are FAIL if the 
            operation is forced stopped and SUCCESS if the operation is still
            successful.
        """
        super(BackendUserError, self).__init__(msg)
        self.status = __STATUS_MAP__[status]

    @property
    def information(self):
        """Additional Information to pass to the frontend"""
        return self._information()

    def _information(self):
        return {}
    

class DataAccessError(BackendError):
    """Base class for exceptions during normal operations.
       i.e. GET, UPDATE, CREATE, DELETE
    """
    error_type = "data"

class ValidationError(BackendError):
    """Base class for exceptions raised during validation."""
    error_type = "validation"

class GenerationError(BackendError):
    """Base class for exceptions raised during generation."""
    error_type = "generation"

class ImportationError(BackendError):
    """Base class for exceptions raised during importation."""
    error_type = "importations"