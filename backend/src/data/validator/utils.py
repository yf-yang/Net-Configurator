# Author: yf-yang <directoryyf@gmail.com>
import os
import os.path as osp
import json
from jsonschema import Draft4Validator, validators

import logging
logger = logging.getLogger(__name__)

def iterate_schemas(directory='schema_spec', root=''):
    filelist = {}
    new_root = osp.join(root, directory)
    for f in os.listdir(new_root):
        fpath = osp.join(new_root, f)
        base, ext = osp.splitext(f)
        if ext == '.json':
            filelist[base] = json.load(open(fpath))
            logger.info('Detect schema file %s' % fpath)
        elif osp.isdir(fpath):
            filelist[base] = iterate_schemas(directory=f, root=new_root)
    return filelist

def enable_default(validator_class):
    validate_properties = validator_class.VALIDATORS["properties"]

    def set_defaults(validator, properties, instance, schema):
        # first validate the schema
        errors = validate_properties(
            validator, properties, instance, schema,
        )

        try:
            # if it fails the validation process, yield errors
            yield next(errors)
        except StopIteration:
            # if the schema is matched
            for property, subschema in properties.items():
                if "default" in subschema:
                    instance.setdefault(property, subschema["default"])

        # yield all the other errors
        for error in errors:
            yield error

    return validators.extend(
        validator_class, {"properties" : set_defaults},
    )

SchemaValidator = Draft4Validator
InitSchemaValidator = enable_default(Draft4Validator)
