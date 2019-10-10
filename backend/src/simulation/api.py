# Author: yf-yang <directoryyf@gmail.com>

from flask import Blueprint, jsonify, request
from ..utils import unknown_error_handler
from . import route
from ..common import DATA_TYPES

import logging
logger = logging.getLogger(__name__)

api = Blueprint('simulation', __name__)

@api.route("/routes", methods=['GET'])
@unknown_error_handler
def query_route():
    # only the first occurance would be used if a key occurs multiple time
    arg_dict = request.args.to_dict(flat=True) 
    logger.info('Initiate route query with %s' 
        % ', '.join(k+'='+v for k, v in arg_dict.items()))
    arg_dict.update({
        k+'ID': arg_dict.pop(k) for k in DATA_TYPES if k in arg_dict
    })
    routes = route.query_routes(**arg_dict)
    return jsonify(routes), 200

@api.route("/bandwidth", methods=['GET'])
@unknown_error_handler
def query_bw():
    # only the first occurance would be used if a key occurs multiple time
    arg_dict = request.args.to_dict(flat=True) 
    logger.info('Initiate route query with %s' 
        % ', '.join(k+'='+v for k, v in arg_dict.items()))
    arg_dict.update({
        k+'ID': arg_dict.pop(k) for k in DATA_TYPES if k in arg_dict
    })
    bw = route.query_bws(**arg_dict)
    return jsonify(bw), 200