# Author: yf-yang <directoryyf@gmail.com>

from ..common import link, node, traffic, multicast_group
import itertools
from collections import defaultdict
from .global_routes import GlobalPolicySimulation
from .local_routes import LocalPolicySimulation
import pprint

import logging
logger = logging.getLogger(__name__)

__METHOD__ = ('UNICAST', 'MULTICAST')

def gen_routes(disabled_link=None, disabled_node=None):
    """Generate routes for all the destinations"""

    ### organize information
    # view the topology as a directed graph
    # represented by adjacency matrix
    # {
    #     to: [
    #         (
    #             hop, 
    #             from, to, 
    #             speed, 
    #             from_port, from_port_bit, to_port, to_port_bit, 
    #             linkID
    #         )
    #     ]
    # }
    adjacency = defaultdict(list)
    # traffic is grouped by address methods (UNICAST/MULTICAST)
    # {
    #     destination: {
    #         source: {
    #             {
    #                 "traffic": [
    #                     {
    #                         "ID": trafficID,
    #                         "bandwidth": bandwidth,
    #                     }
    #                 ],
    #                 "bandwidth": total bandwidth,
    #             }
    #         }
    #     }
    # }
    utraffic = defaultdict(
        lambda: defaultdict(
            lambda: {'traffic': [], 'bandwidth': 0.0}))
    mtraffic = defaultdict(
        lambda: defaultdict(
            lambda: {'traffic': [], 'bandwidth': 0.0}))

    for linkID, l in link.items():
        (x, x_port), (y, y_port) = l['endpoints']
        # device port bit is undefined, assume they are all -1 for now
        x_port_bit = node[x]['ports'][x_port].get('port_bit', -1)
        y_port_bit = node[y]['ports'][y_port].get('port_bit', -1)
        speed = l['available_bandwidth']
        
        adjacency[y].append(
            (
                1, 
                x, y, 
                speed, 
                x_port, x_port_bit, y_port, y_port_bit, 
                linkID
            )
        )
        adjacency[x].append(
            (
                1, 
                y, x, 
                speed, 
                y_port, y_port_bit, x_port, x_port_bit, 
                linkID
            )
        )


    for trafficID, t in traffic.items():
        address_method = t['destination']['address_method']
        if address_method == 'UNICAST':
            src = t['source']['device']
            dst = t['destination']['device']
            utraffic[dst][src]['traffic'].append(
                {
                    'ID': trafficID, 
                    'bandwidth':t['bandwidth']
                })
            utraffic[dst][src]['bandwidth'] += t['bandwidth']
        elif address_method == 'MULTICAST':
            src = t['source']['device']
            mg = t['destination']['multicast_group']
            mtraffic[mg][src]['traffic'].append(
                {
                    'ID': trafficID, 
                    'bandwidth':t['bandwidth']
                })
            mtraffic[mg][src]['bandwidth'] += t['bandwidth']

    # A mapping from destination to all possible sources
    dst_src_combination = defaultdict(set)
    dst_src_combination.update({
        dst: set(srcs) for dst, srcs in utraffic.items()
    })
    # add mulitcast sources into the mapping
    for mg, srcs in mtraffic.items():
        for dst in multicast_group[mg]['devices']:
            for src in srcs:
                dst_src_combination[dst].add(src)

    global_graph = GlobalPolicySimulation(
        adjacency, 
        utraffic, 
        mtraffic, 
        dst_src_combination
    )


    routes, overview = global_graph.get_overview(
        disabled_link=disabled_link, disabled_node=disabled_node)
    return routes, overview

def gen_local_routes():
    """Generate routes for all the destinations"""

    ### organize information
    # view the topology as a directed graph
    # represented by adjacency matrix
    # {
    #     to: [
    #         (
    #             hop, 
    #             from, to, 
    #             speed, 
    #             from_port, from_port_bit, to_port, to_port_bit, 
    #             linkID
    #         )
    #     ]
    # }
    adjacency = defaultdict(list)
    # traffic is grouped by address methods (UNICAST/MULTICAST)
    # {
    #     destination: {
    #         source: {
    #             {
    #                 "traffic": [
    #                     {
    #                         "ID": trafficID,
    #                         "bandwidth": bandwidth,
    #                     }
    #                 ],
    #                 "bandwidth": total bandwidth,
    #             }
    #         }
    #     }
    # }
    utraffic = defaultdict(
        lambda: defaultdict(
            lambda: {'traffic': [], 'bandwidth': 0.0}))
    mtraffic = defaultdict(
        lambda: defaultdict(
            lambda: {'traffic': [], 'bandwidth': 0.0}))

    for linkID, l in link.items():
        (x, x_port), (y, y_port) = l['endpoints']
        # device port bit is undefined, assume they are all -1 for now
        x_port_bit = node[x]['ports'][x_port].get('port_bit', -1)
        y_port_bit = node[y]['ports'][y_port].get('port_bit', -1)
        speed = l['available_bandwidth']
        
        adjacency[y].append(
            (
                1, 
                x, y, 
                speed, 
                x_port, x_port_bit, y_port, y_port_bit, 
                linkID
            )
        )
        adjacency[x].append(
            (
                1, 
                y, x, 
                speed, 
                y_port, y_port_bit, x_port, x_port_bit, 
                linkID
            )
        )


    for trafficID, t in traffic.items():
        address_method = t['destination']['address_method']
        if address_method == 'UNICAST':
            src = t['source']['device']
            dst = t['destination']['device']
            utraffic[dst][src]['traffic'].append(
                {
                    'ID': trafficID, 
                    'bandwidth':t['bandwidth']
                })
            utraffic[dst][src]['bandwidth'] += t['bandwidth']
        elif address_method == 'MULTICAST':
            src = t['source']['device']
            mg = t['destination']['multicast_group']
            mtraffic[mg][src]['traffic'].append(
                {
                    'ID': trafficID, 
                    'bandwidth':t['bandwidth']
                })
            mtraffic[mg][src]['bandwidth'] += t['bandwidth']

    # A mapping from destination to all possible sources
    dst_src_combination = defaultdict(set)
    dst_src_combination.update({
        dst: set(srcs) for dst, srcs in utraffic.items()
    })
    # add mulitcast sources into the mapping
    for mg, srcs in mtraffic.items():
        for dst in multicast_group[mg]['devices']:
            for src in srcs:
                dst_src_combination[dst].add(src)

    local_graph = LocalPolicySimulation(
        adjacency, 
        utraffic, 
        mtraffic, 
        dst_src_combination
    )


    routes = local_graph.gen_routes()
    return routes

def filter_traffic(src, dst, trafficID, method):
    dst_key = 'device' if method == 'UNICAST' else 'multicast_group'
    src_key = 'device'

    database = traffic
    if method is not None:
        database = {
            k: v for k, v in database.items()
                if v['destination']['address_method'] == method
        }

    if trafficID is not None:
        if trafficID not in database:
            return []
        database = {trafficID: database[trafficID]}

    if src is not None:
        database = {
            k: v for k, v in database.items()
                if v['source'][src_key] == src
        }

    if dst is not None:
        database = {
            k: v for k, v in database.items()
                if v['destination'][dst_key] == dst
        }
    
    trafficID = []
    for k, v in database.items():
        trafficID.append(
            (
                v['source'][src_key], # src
                v['destination'][dst_key], # dst
                k, # trafficID
                method, # method
            ))
    return trafficID

def query_factory(src, dst, trafficID, flink, fnode, method):
    """Fill None argument and wrap arguments in an iterable"""
    # method must be present
    if method not in __METHOD__:
        raise Exception("Argument <method> should be one of %s, but got %s"
            % (', '.join(__METHOD__), method))

    # flink & fnode combinations, supported commbinations are
    # flink - Situation when a link is down
    # fnode - Situation when a node is down
    # Neither - Situation when neither of them is down, i.e. primary path
    if flink is not None and fnode is not None:
        raise Exception("flink and fnode should not be offered simultaneously")
    flink = [flink]
    fnode = [fnode]

    ### src & dst & traffic combinations, supported combinations are:
    # src - All the paths of traffic that originate from src
    # dst - All the paths of traffic that head toward dst
    # traffic - A specific traffic path
    # src & dst - All the paths of traffic between src & dst
    trafficID = filter_traffic(
        src=src, dst=dst, trafficID=trafficID, method=method)
    return itertools.product(flink, fnode, trafficID)

def query_routes(
    src=None,
    dst=None,
    trafficID=None,
    flink=None,
    fnode=None,
    method=None):
    """Query route(s) on given situation
    
    Parameters
    ----------
    src : str
        Source device ID.
    dst : str
        Destination device ID or Multicast Group ID.
    trafficID : str
        Traffic ID.
    flink : str
        ID of the failed link.
    fnode : str
        ID of the failed node.
    method : str
        Address method to determine destination type. Supported values are
        UNICAST and MULTICAST.
    """
    # Replace None values and wrap all values in an iterable

    querys = query_factory(src, dst, trafficID, flink, fnode, method)
    results = []
    for q in querys:
        flink, fnode, (src, dst, trafficID, method) = q
        routes, info = gen_routes(flink, fnode)

        links = []

        shortest_route_tree = routes[dst]

        if method == 'UNICAST':
            # source may be in a different connected component
            if src not in shortest_route_tree:
                continue

            from_node = src
            while from_node != dst:
                to_node, linkID = shortest_route_tree[from_node]
                if from_node == fnode or linkID == flink:
                    break
                links.append(
                    {
                        'from': from_node,
                        'to': to_node,
                        'link': linkID
                    })
                from_node = to_node
        elif method == 'MULTICAST':
            queue = [src]

            # source may be in a different connected component
            if src not in shortest_route_tree:
                continue

            # add every link to the returned information in a BFS manner
            while queue:
                from_node = queue.pop(0)
                for to_node, linkID in shortest_route_tree[from_node]:
                    if to_node == fnode or linkID == flink:
                        continue
                    
                    links.append(
                    {
                        'from': from_node,
                        'to': to_node,
                        'link': linkID
                    })

                    # if to_node is not destination, add it to the queue
                    if to_node in shortest_route_tree:
                        queue.append(to_node)

        results.append(
            dict(
                src = src,
                dst = dst,
                traffic = trafficID,
                method = method,
                links = links
                ))
    return results 

def query_bws(flink=None, fnode=None):
    if flink is not None and flink not in link:
        raise Exception
    if fnode is not None and fnode not in node:
        raise Exception
    routes, info = gen_routes(flink, fnode)

    bwresult = {
        linkID: [
            {
                'from': from_node,
                'to': to_node,
                'traffic': direction_info['traffic'],
                'bandwidth': direction_info['bandwidth']
            }
            for (from_node, to_node), direction_info in link_info.items()
        ] for linkID, link_info in info.items()
    }
    return bwresult
