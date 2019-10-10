# Author: yf-yang <directoryyf@gmail.com>

from ..utils import iterate_schemas
import os

__all__ = ['schema_tree', 'schema']

# a tree of schema to use based on 1-level keys
# <default>
schema_tree = iterate_schemas(root=os.path.dirname(__file__))

# input/output schema of node manager
schema = {
    "title": "MulticastGroupSchemas",
    "description": "Valid node input/output JSON payload.",
    "oneOf": [
        schema for name, schema in schema_tree.items() 
    ]
}