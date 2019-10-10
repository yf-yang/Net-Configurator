# Author: yf-yang <directoryyf@gmail.com>

import traceback as tb
from functools import wraps
from .exceptions import BackendFatalError, BackendUserError
from werkzeug.exceptions import HTTPException
from flask import abort, jsonify
import json
import glob
import os
import os.path as osp
from . import common
from . import data

import logging
logger = logging.getLogger(__name__)

# from https://github.com/python/cpython/blob/master/Lib/functools.py#L30
WRAPPER_ASSIGNMENTS_NO_DOCSTRING =  ('__module__', '__name__', '__qualname__', 
        '__annotations__')
    
def unknown_error_handler(api):
    # the following line removes docstring from swagger page
    @wraps(api, assigned=WRAPPER_ASSIGNMENTS_NO_DOCSTRING)
    def handler(*args, **kwargs):
        try:
            return api(*args, **kwargs)
        except HTTPException:
            raise
        except BackendUserError as e:
            raise
            logger.error(e)
            ### return message along with additional information
            return dict(type=e.error_type, msg=str(e), 
                status = e.status, **e.information), 409
        except BackendFatalError as e:
            logger.critical("Fatal bug captured", exc_info=True)
            return dict(type=e.error_type, msg=str(tb.format_exc())), 400
        except Exception as e:
            logger.critical("Flask call aborts due to unexpected error",
                exc_info=True)
            abort(500)
    return handler

def clear_cache_dir():
    for f in glob.glob(osp.join(common.CACHE_DIR, '*')):
        os.remove(f)

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (data.StateManager, data.BaseDataManager)):
            return obj.as_dict()
        return json.JSONEncoder.default(obj)