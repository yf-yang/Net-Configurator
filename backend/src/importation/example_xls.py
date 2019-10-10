# Author: yf-yang <directoryyf@gmail.com>

import xlrd
from ..common import node, traffic
from .exceptions import FileLoadError

import logging
logger = logging.getLogger(__name__)

NODE_NAME = 0
NODE_TYPE = 1
NODE_MAC = 2
NODE_IP = 3

TRAFFIC_SOURCE_PORT = 0
TRAFFIC_SOURCE_IP = 1
TRAFFIC_BANDWIDTH = 2
TRAFFIC_LATENCY = 3
TRAFFIC_JITTER = 4
TRAFFIC_PROTOCOL = 5
TRAFFIC_PRIORITY = 6
TRAFFIC_NAME = 7
TRAFFIC_DESTINATION_PORT = 8
TRAFFIC_DESTINATION_IP = 9

def load(file):
    book = xlrd.open_workbook(file)

    # register nodes
    sheet_node = book.sheet_by_name('node')

    # lookup table from IP address to node ID
    IP_ID_MAP = {}

    for rx in range(1, sheet_node.nrows): # skip headers
        row = sheet_node.row(rx)
        node_type = row[NODE_TYPE].value
        IP_addr = row[NODE_IP].value
        MAC_addr = row[NODE_MAC].value
        name = row[NODE_NAME].value

        if node_type == 'switch':      
            nreturn = node.create(
                node_type='SWITCH', model='SWMODEL1',
                query={
                    'name': name,
                    'IP': IP_addr,
                    'MAC': MAC_addr,
                })

        elif node_type == 'device':
            nreturn = node.create(
                node_type='DEVICE', model='ETHMODEL1',
                query={
                    'name': name,
                    'IP': IP_addr,
                    'MAC': MAC_addr,
                }
            )
        else:
            raise FileLoadError('Unknown node type %s' % node_type)

        ID, = nreturn.keys()
        if IP_addr in IP_ID_MAP:
            raise FileLoadError('Duplicated IP address %s' % IP_addr)
        IP_ID_MAP[IP_addr] = ID

    # register traffic
    sheet_traffic = book.sheet_by_name('traffic')

    for rx in range(1, sheet_traffic.nrows):
        row = sheet_traffic.row(rx)
        src_port = int(row[TRAFFIC_SOURCE_PORT].value)
        src_IP = row[TRAFFIC_SOURCE_IP].value
        bandwidth = int(row[TRAFFIC_BANDWIDTH].value)
        latency = int(row[TRAFFIC_LATENCY].value)
        jitter = int(row[TRAFFIC_JITTER].value)
        protocol = row[TRAFFIC_PROTOCOL].value.upper()
        priority = int(row[TRAFFIC_PRIORITY].value)
        name = row[TRAFFIC_NAME].value
        dst_port = int(row[TRAFFIC_DESTINATION_PORT].value)
        dst_IP = row[TRAFFIC_DESTINATION_IP].value

        traffic.create(
            traffic_type='IP',
            query={
                'name': name,
                'source': {
                    'device': IP_ID_MAP.get(src_IP, ''),
                        'port': src_port,
                },
                'destination': {
                    'address_method': 'UNICAST',
                    'device': IP_ID_MAP.get(dst_IP, ''),
                    'port': dst_port,
                },
                'priority': priority,
                'protocol': protocol,
                'max_latency': latency,
                'max_jitter': jitter,
                'bandwidth': bandwidth,
            })