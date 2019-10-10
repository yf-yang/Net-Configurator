# Author: yf-yang <directoryyf@gmail.com>

from werkzeug.utils import secure_filename
from .exceptions import UnsupportedExtensionError
import os.path as osp
from . import example_xls
from ..utils import clear_cache_dir
from ..common import StateManager, CACHE_DIR

import logging
logger = logging.getLogger(__name__)

# a dict mapping from file extension to the import function
__IMPORT_FUNCTIONS__ = {
    '.xlsx': example_xls.load,
}

__ALLOWED_EXTENSIONS__ = tuple(__IMPORT_FUNCTIONS__.keys())

def load(file):
    ext = osp.splitext(file.filename)[1].lower() 
    if ext not in __ALLOWED_EXTENSIONS__:
        raise UnsupportedExtensionError("Unknown file extension %s" % ext)
    # refer to 
    # flask.pocoo.org/docs/1.0/patterns/fileuploads/#a-gentle-introduction
    filename = osp.join(CACHE_DIR, secure_filename(file.filename))
    clear_cache_dir()
    file.save(filename)
    # Clear the state manager first
    sm = StateManager()
    __IMPORT_FUNCTIONS__[ext](filename)
    return sm