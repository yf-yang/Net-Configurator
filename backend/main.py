#!/usr/local/bin/python
# Authors: Yifei Yang <yifeiyan@cisco.com>

import os
import os.path as osp
import sys
import yaml

import logging.config

if __name__ == '__main__':
    # logging configurations
    logging_cfg = yaml.safe_load(open('logging.conf.yaml'))
    loglevel = os.environ.get('LOGLEVEL', 'INFO')
    logging_cfg['loggers']['src']['level'] = loglevel

    logging.config.dictConfig(logging_cfg)

    from src import app
    app.run(host='0.0.0.0')