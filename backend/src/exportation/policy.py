# Author: yf-yang <directoryyf@gmail.com>
from ..common import CACHE_DIR, node
from ..simulation import gen_local_routes
import json
import os.path as osp
import logging
logger = logging.getLogger(__name__)

def generate():
    routes = gen_local_routes()

    # initialization
    FORWARD_TABLE = {
        sw: [] for sw in node.switches().keys()
    }

    for destination, route in routes.items():
        dest_node = node[destination]
        dest_MAC = dest_node['MAC']
        for sw, (primary, backup) in route.items():
            if sw not in FORWARD_TABLE: # not a switch
                continue
            ob_port, target_node, ob_link = primary
            ob_port_bit = node[sw]['ports'][ob_port]['port_bit']
            primary_entry = {
                'outbound_port': ob_port,
                'outbound_port_bit': ob_port_bit
            }

            if backup:
                ob_port, target_node, ob_link = backup
                ob_port_bit = node[sw]['ports'][ob_port]['port_bit']
                backup_entry = {
                    'outbound_port': ob_port,
                    'outbound_port_bit': ob_port_bit
                } 
            else:
                backup_entry = None

            FORWARD_TABLE[sw].append({
                'destination': dest_MAC,
                'primary': primary_entry,
                'backup': backup_entry,
            })

    for sw, FW_TABLE in FORWARD_TABLE.items():
        fname = node[sw]['name']+'.FW_TABLE.json'
        json.dump(FW_TABLE, open(osp.join(CACHE_DIR, fname), 'w'), indent=2)