# Author: yf-yang <directoryyf@gmail.com>
from flask_restplus import fields
__all__ = ['ERROR_MESSAGE', 'RESPONSE_EXPECTED_ERROR', 'RESPONSE_UNKNOWN_ERROR']

ERROR_MESSAGE = {
    "type": fields.String(
        enum=('USER', 'INTERNAL', 'FLASK'),
        title='Error Type',
        description=
            "USER: Error triggered by wrong user inputs, such as a currupt "
            "configuration file or a validation error.\n"
            "INTERNAL: Error triggered by EXPECTED wrong frontend call or "
            "wrong backend behavior.\n"
            "FLASK: Error handled by Flask, frontend developers "
            "should check FLASK documentations for reference."
    ),
    "code": fields.String(
        title="Error Code",
        description=
        "For error type 'USER' or 'INTERNAL', check documentations for "
        "details about the error. For error type 'FLASK', it is always "
        "'FLASK'."
    ), # No code will be provided
    "message": fields.String(
        title="Error Message",
        description=
        "For error type 'USER', the message is intended to be "
        "shown to the user. For error type 'INTERNAL', it facilitates "
        "frontend developers to locate bugs. For error type 'FLASK', it "
        "simply copy the FLASK error message."
    ),
    "context": fields.Raw(
        {}, 
        title="ErrorContext",
        decription=
        "Necessary context information provided to frontend to better "
        "illustrate the error to users."
    ),
    "trace_id": fields.String(
        title="Error Trace ID",
        description=
        "ID to locate the error from the backend log."
    ),
}

RESPONSE_EXPECTED_ERROR = "Predefined errors are captured"
RESPONSE_UNKNOWN_ERROR = "Unexpected errors are raised from the backend"