# Author: yf-yang <directoryyf@gmail.com>

from ..utils import iterate_schemas
import os

__all__ = ['schema_tree', 'schema']

# a tree of schema to use based on 2-level keys
# <node_type> (DEVICE, SWITCH)
# <model>
schema_tree = iterate_schemas(root=os.path.dirname(__file__))

# input/output schema of node manager
schema = {
    "title": "NodeSchemas",
    "description": "Valid node input/output JSON payload.",
    "oneOf": [
        schema 
            for node_type_val in schema_tree.values() 
                for model, schema in node_type_val.items()
    ]
}