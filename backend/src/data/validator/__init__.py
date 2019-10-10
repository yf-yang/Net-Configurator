from .utils import SchemaValidator, InitSchemaValidator
from . import node
from . import traffic
from . import multicast_group

InitNodeValidator = InitSchemaValidator(node.schema)
NodeValidator = SchemaValidator(node.schema)

InitTrafficValidator = InitSchemaValidator(traffic.schema)
TrafficValidator = SchemaValidator(traffic.schema)

InitMulticastGroupValidator = InitSchemaValidator(multicast_group.schema)
MulticastGroupValidator = SchemaValidator(multicast_group.schema)

schema_tree = {
    'node': node.schema_tree,
    'traffic': traffic.schema_tree,
    'multicast_group': multicast_group.schema_tree
}