# Author: yf-yang <directoryyf@gmail.com>

import heapq
from collections import defaultdict
from boltons.dictutils import OrderedMultiDict
from ..common import node, multicast_group
import pprint

import logging
logger = logging.getLogger(__name__)

# infinity
INFTY = float('inf')

class GlobalPolicySimulation(object):
    def __init__(self, adj, utraffic, mtraffic, dst_src_combination):
        """ Initiliza the graph with adjacent matrix and total node count.

        Parameters
        ----------
        adj : dict
            Adjacent matrix of a directed graph.
            It is represented as a mapping, where the value is a list of tuples
            that represent different links and the key is the node that all the
            links in the list go toward.
            The structure is like:
            {
                to: [
                    (
                        hop, 
                        from, to, 
                        speed, 
                        from_port, from_port_bit, to_port, to_port_bit, 
                        linkID
                    )
                ]
            }
            It could also be considered as:
            {
                from: [
                    (
                        hop, 
                        to, from, 
                        speed, 
                        to_port, to_port_bit, from_port, from_port_bit, 
                        linkID
                    )
                ]
            }
        utraffic : dict
            Clustered traffic dictionary for UNICAST.
            All the traffic clustered first by destination, then source.
            The structure is like:
            {
                destination: {
                    source: {
                        {
                            "traffic": [
                                {
                                    "ID": trafficID,
                                    "bandwidth": bandwidth,
                                }
                            ],
                            "bandwidth": total bandwidth,
                        }
                    }
                }
            }
            We cluster them because there is no need to compute the same route
            for different message that has the same destination and source.
            Destination is at higher level because ARL table is a mapping from 
            destination to port, so in order to avoid loop, we actually generate
            trees for each destination, where each destination is the root and 
            leaves are different sources.
        mtraffic: dict
            Clustered traffic dictionary for MULTICAST.
            The structure is similar as utraffic, the only difference is that 
            destination is a frozenset of node IDs instead of a single node ID.
        dst_src_combination: dict
            A mapping from destination to all the sources that send traffic to
            it, including both UNICAST and MULTICAST.
        """
        self.adj = adj
        self.utraffic = utraffic
        self.mtraffic = mtraffic
        self.dst_src_combination = dst_src_combination
        self.switches = {
            nodeID for nodeID, n in node.items() 
                if n['type'] == 'SWITCH'
        }
        self.gen_connected_components()
        self.primary_routes = self.gen_routes()

    def gen_connected_components(self):
        """
        Detect all the cut edges / cut endpoints (Tarjan Algorithm).
        Split the graph into different connected components.
        """

        # ----- temporary variables
        # temp: endpoints haven't been traversed
        self._tmp_untraversed = self.switches.copy()
        # temp: order of a node in the DFS
        self._tmp_order = defaultdict(lambda: INFTY)
        # temp: the lowest depth a node is connected to
        self._tmp_low = defaultdict(lambda: INFTY)
        # temp: parent of a node in the DFS
        self._tmp_parent = defaultdict(lambda: -1)

        # Initialize every ETH node with a distinct number
        node_connected_components = OrderedMultiDict(
            (nodeID, i) for i, (nodeID, n) in enumerate(node.items())
            if n['protocol'] == 'ETH')

        link_connected_components = OrderedMultiDict()

        # Initialize every ETH non-switch as type 2
        entity_type = OrderedMultiDict(
            (nodeID, 't2') for nodeID, n in node.items()
            if n['type'] != 'SWITCH' and n['protocol'] == 'ETH')

        while self._tmp_untraversed:
            # temp: all links of a connected components
            self._tmp_links = set()
            # temp: all endpoints of a connected components
            self._tmp_nodes = set()

            # ----- special links/endpoints
            ############################# Explanation ##########################
            """
            We categorize all the links and endpoints by 2 dimensions , so there
            are 2 * 2 = 4 categories in total. Suppose a link/endpoint is down,
            then there would be 4 possible results:

                                          New Routes are needed

                                            No      |       Yes  
                                                    |
                                    No      ---     |     Type I
            Some traffic will not                   |
            be reachable            ----------------+----------------
                                                    |
                                    Yes   Type II   |    Type III
                                                    |

            I'll use an example to explain these categories, and why we care
            about these scenarios:
            """
            
            ###################################################################
            #                                                                 #
            #                             A                                   #
            #                             |                                   #
            #                             |                                   #
            #                             |                                   #
            #                             1 ----- 2                           #
            #                              \     /                            #
            #                               \   /                             #
            #                                \ /                              #
            #                                 3                               #
            #                                 |                               #
            #                                 |                               #
            #                                 4                               #
            #                                / \                              #
            #                               /   \                             #
            #                              /     \                            #
            #                     C ----- 5       6 ------┐                   #
            #                             |       |       |                   #
            #                             |       |       B                   #
            #   A,B,C - DEVICES           |       |       |                   #
            #   1 ~ 8 - SWITCHES          7 ----- 8 ------┘                   #
            #                                                                 #
            ###################################################################

            """
            Type I: When the link/endpoint is down, new routes are needed, all
            traffic are still reachable
            - Endpoints: 2, 6, 7, 8
            - Links: 1-2, 1-3, 2-3, 4-5, 5-7, 7-8, 8-6, 6-4, 8-B, 6-B

            When one of these links/endpoints is down, the network will function
            as good, but traffic should take failover routes. Net Configurator
            will generate alternative routes for all of these scenarios.

            In the algorithm, such links/endpoints are not cut edges / cut 
            vertices.

            ------

            Type II: When the link/endpoint is down, every traffic will still
            take the primary route, while some of them will not be reachable.
            - Endpoints: A, B, C
            - Links: 3-4, 1-A, 5-C
            
            When one of these links/endpoints is down, some of the traffic will
            be dropped somewhere, but if a traffic is still reachable, then they
            will still take the primary route, so we will not generate new routes
            for these scenarios to reduce the ARL table size.

            In the algorithm, such links are cut edges; such endpoints are cut
            vertices, but not all cut vertices are type II endpoints. To be more
            precise, if an endpoint E connects to exactly one another endpoint, 
            or all the other endpoints that E connects to are not connected 
            w.r.t. any other endpoints except for E itself, then E is a type II
            endpoint.

            Note that in this example, if endpoint 5 is down, traffic between A 
            and B will not need a failover route, but 5 is not categorized as a
            type II endpoint, since 4 and 7 are connected w.r.t. some other
            links. Actually, we are not able to categorize 5 as type II to save
            memory, since connected components detection and link/node 
            categorization step is done before routes are calculated. Due to 
            that reason, 1 and 5 are not type II endpoints.

            I'm not sure if type II should exist. Although we can save memory
            in such scenarios, unreachable traffic will still take up the 
            bandwidth and resources of links/switches until they are dropped at
            the broken link/switch unless applications on top of IP Layer stops
            to send these traffic. Maybe we will decide to use more memory, but
            save runtime resources. There is a tradeoff.
            
            ------

            Type III: When the endpoint is down, some traffic will take failover
            routes while some may not and some traffic will be unreachable.
            - Endpoints: 1, 3, 4, 5

            When one of these endpoints is down, some traffic will be dropped
            and even some traffic are still reachable, they may need a failover
            route. In this scenario, we need to generate failover routes.

            In the algorithm, if an endpoint E connects to some endpoints that
            connect to each other w.r.t. links other than E, then E is a 
            type III endpoint.

            Note that no links are categorized as type III, since if a link is
            down, either all the devices are still connected in the same 
            connected component, or some are disconnected but we could use the 
            primary route and drop unreachable traffics somewhere.

            -----

            It will never happen that when a link/endpoint is down, no traffics
            are dropped and no failover route is needed. In this toy example,
            switch 2 is such an endpoint, but we still categorize it as type I
            because connected components detection and link/node categorization 
            step is done before routes are calculated.

            When we are calculating the shortest route tree, all the switches and
            links that not appears in the tree will be recorded. They will be a
            special part of type I that no failover routes will be generated for
            these links/switches. Endpoint 2, 7, 8 and links 1-2, 2-3, 5-7, 6-8,
            7-8, 8-B are such links/switches in this example.

            """

            # temp: non-cut links
            self._tmp_type1_links = set()
            # temp: cut links
            self._tmp_type2_links = set()

            # temp: non-cut endpoints
            self._tmp_type1_nodes = set()
            # temp: type 2 cut endpoints
            self._tmp_type2_nodes = set()
            # temp: type 3 cut endpoints
            self._tmp_type3_nodes = set()

            # order counter
            self.__order = 0 

            # randomly choose an endpoint as DFS root
            DFS_ROOT = self._tmp_untraversed.pop()

            self.bridge_update(DFS_ROOT)

            self._tmp_type1_links = self._tmp_links - self._tmp_type2_links

            ccID = node_connected_components[DFS_ROOT]

            node_connected_components.update({
                nodeID: ccID for nodeID in self._tmp_nodes
            })

            link_connected_components.update({
                linkID: ccID for linkID in self._tmp_links
            })

            entity_type.update({
                nodeID: 't1' for nodeID in self._tmp_type1_nodes
            })

            entity_type.update({
                nodeID: 't2' for nodeID in self._tmp_type2_nodes
            })

            entity_type.update({
                nodeID: 't3' for nodeID in self._tmp_type3_nodes
            })

            entity_type.update({
                linkID: 't1' for linkID in self._tmp_type1_links
            })

            entity_type.update({
                linkID: 't2' for linkID in self._tmp_type2_links
            })            

            self._tmp_untraversed -= self._tmp_nodes

        self.node_connected_components = node_connected_components
        self.link_connected_components = link_connected_components
        self.entity_type = entity_type

    def bridge_update(self, nodeID):
        """Update a node status
        Parameters
        ----------
        nodeID : str
            ID of the node being traversed.
        """

        self._tmp_nodes.add(nodeID)

        self._tmp_order[nodeID] = self.__order
        self._tmp_low[nodeID] = self.__order

        child_orders = []

        # traverse every child
        for _, child, _, _, _, _, _, _, linkID in self.adj[nodeID]:
            self._tmp_links.add(linkID)

            # not traversed
            if self._tmp_order[child] == INFTY:
                self.__order += 1
                self._tmp_parent[child] = nodeID
                self.bridge_update(child)
                self._tmp_low[nodeID] = min(
                    self._tmp_low[child], self._tmp_low[nodeID]
                )

                child_orders.append(
                    cmp(self._tmp_low[child], self._tmp_order[nodeID])
                )

            elif child != self._tmp_parent[nodeID]:
                self._tmp_low[nodeID] = min(
                    self._tmp_low[child], self._tmp_low[nodeID]
                )

            if self._tmp_low[child] > self._tmp_order[nodeID]:
                self._tmp_type2_links.add(linkID)

        if self._tmp_parent[nodeID] != -1:
            # endpoint is not DFS_ROOT
            if all(order == -1 for order in child_orders):
                self._tmp_type1_nodes.add(nodeID)
            elif all(order == 1 for order in child_orders):
                self._tmp_type2_nodes.add(nodeID)
            else:
                self._tmp_type3_nodes.add(nodeID)
        else:
            # endpoint is DFS_ROOT
            if len(child_orders) == 1 and child_orders[0] == 0:
                self._tmp_type1_nodes.add(nodeID)
            elif all(order == 1 for order in child_orders):
                self._tmp_type2_nodes.add(nodeID)
            else:
                self._tmp_type3_nodes.add(nodeID)

    def gen_routes(self, disabled_link=None, disabled_node=None):
        """Get shortest route trees start from all destinations.

        Parameters:
        disabled_link : str
            Link ID of disabled link.

        disabled_node : int
            Node ID of disabled node.

        Returns 
        -------
        routes : dict
            Mapping from target to multiple routes.
        """

        if disabled_link is not None and disabled_node is not None:
            raise Exception('TBD')

        if disabled_link is not None:
            if self.entity_type[disabled_link] == 't2':
                return self.primary_routes

        if disabled_node is not None:
            if self.entity_type[disabled_node] == 't2':
                return self.primary_routes

        self.shortest_route_trees = {
            dst: self.get_shortest_route_tree(
                dst,
                disabled_link = disabled_link,
                disabled_node = disabled_node
            ) for dst in self.dst_src_combination
        }

        routes = {
            udst: self.get_unicast_global_routes(
                udst
            ) for udst in self.utraffic
        }
        routes.update({
            mdst: self.get_multicast_global_routes(
                mdst
            ) for mdst in self.mtraffic
        })
        return routes

    def get_shortest_route_tree(self, 
            dst, disabled_link=None, disabled_node=None):
        """Get the shortest route tree with Dijkstra Algorithm.

        Parameters
        ----------
        dst : str
            ID of destination node, which is the root of the tree.

        disabled_link : str
            Link ID of disabled link.

        disabled_node : str
            Node ID of disabled node.

        Returns
        -------
        tree : dict
            Mapping from each node to its parent and actual link ID.
        """
        tree = {}
        tree_nodes = set()

        ccID = self.node_connected_components[dst]
        cc_nodes = set(self.node_connected_components.inverted().getlist(ccID))

        srcs = self.dst_src_combination[dst] & cc_nodes

        pq = PriorityQueue(dst)

        if disabled_node is not None:
            # remove the disabled endpoint from the graph
            adj = {
                to_node: [
                    link_info for link_info in links 
                        if link_info[1] != disabled_node
                ] for to_node, links in self.adj.items() 
                    if to_node != disabled_node
            }
        else:
            adj = self.adj

        
        if disabled_link is not None:
            # remove the disabled link from the graph
            adj = {
                to_node: [
                    link_info for link_info in links 
                        if link_info[-1] != disabled_link
                ] for to_node, links in self.adj.items() 
                    if to_node != disabled_link
            }

        # ------------ Note of the Algorithm ------------    
        # We will treat the graph as a directed graph, even though it is
        # actually an undirected graph, because dijkstra is a greedy search
        # algorithm which accidentally achieves global optimum. That way, the
        # other direction will be disposed and will not affect the algorithm.

        # Initialize the priority queue
        for (
                weight, 
                from_node, to_node, 
                speed, 
                from_port, from_port_bit, to_port, to_port_bit,
                linkID
            ) in adj[dst]:

            pq.push(
                (
                    # order of links: 
                    #   weight (lower first)
                    #   speed (higher first)
                    #   inbound port (lower first)
                    (weight, -speed, to_port_bit), 
                    # source node
                    from_node,
                    # destination node and linkID
                    (to_node, linkID),
                )
            )

        while srcs:
            l = pq.pop()
            if l is None:
                # If some of the destinations are not reachable, then the loop
                # terminates
                break
            (cost, _, _), from_node, path = l
            tree[from_node] = path
    
            # if get an source
            if from_node in srcs:
                srcs.remove(from_node)

                # add all the parent nodes to the set
                while from_node not in tree_nodes and from_node != dst:
                    tree_nodes.add(from_node)
                    from_node, _ = tree[from_node]

            # now the source becomes the new destination
            # add all links that go to the source to the priority queue
            new_dst = from_node
            for (
                weight, 
                from_node, to_node, 
                speed, 
                from_port, from_port_bit, to_port, to_port_bit,
                linkID
            ) in adj[new_dst]:
                pq.push(
                    (
                        # order of links: 
                        #   weight (lower first)
                        #   speed (higher first)
                        #   inbound port (lower first)
                        (weight+cost, -speed, to_port_bit), 
                        # source node
                        from_node,
                        # destination node and linkID
                        (to_node, linkID),
                    )
                )

        tree = {
            from_node: path 
                for from_node, path in tree.items() if from_node in tree_nodes
        }

        return tree

    def get_unicast_global_routes(self, dst):
        """Generate routes to the given destination from every sources.

        Parameters
        ----------
        dst: str
            ID of unicast destination node, which is the root of the tree.

        Returns
        -------
        tree: dict
            A map from each source to a tuple of route information including:
                - next hop node
                - linkID
        """
        return self.shortest_route_trees[dst]

    def get_multicast_global_routes(self, mgID):
        """Generate routes to the given multicast group from the source

        Parameters
        ----------
        mgID: str
            ID of multicast destination group, which is the root of the tree.

        Returns
        -------
        tree: dict
            A map from each source to a set that contains tuples of:
                - next hop node
                - linkID
        """
        dsts = multicast_group[mgID]['devices']
        tree = defaultdict(set)

        # a multicast group should only have one traffic, so although we don't
        # add any validation before this statement, it should work well
        # if an excepetion occurs here, that means the validation that there is
        # exactly one source for the multicast group is missing
        src, = self.mtraffic[mgID]

        for dst in dsts:
            route = self.shortest_route_trees[dst]

            # source may be in a different connected component
            if src not in route:
                continue

            from_node = src
            while from_node != dst:
                hop_info = route[from_node]
                tree[from_node].add(hop_info)
                from_node, _ = hop_info

        return tree


    def get_overview(self, disabled_link=None, disabled_node=None):
        overview = defaultdict(
            lambda: defaultdict(
                lambda: {'traffic': [], 'bandwidth': 0.0}))

        # if disabled_node is None and disabled_link is None:
        #     routes = self.primary_routes
        # else:
        routes = self.gen_routes(
            disabled_link=disabled_link, 
            disabled_node=disabled_node)

        for dst, srcs in self.utraffic.items():
            shortest_route_tree = routes[dst]

            for src, traffic_info in srcs.items():
                # source may be in a different connected component
                if src not in shortest_route_tree:
                    continue
                from_node = src

                while from_node != dst:
                    to_node, linkID = shortest_route_tree[from_node]

                    if to_node == disabled_node or linkID == disabled_link:
                        break
                    
                    l = overview[linkID][from_node, to_node]
                    l['traffic'] += traffic_info['traffic']
                    l['bandwidth'] += traffic_info['bandwidth']

                    from_node = to_node

        for mgID, srcs in self.mtraffic.items():
            shortest_route_tree = routes[mgID]

            # a multicast group should only have one traffic, so although we 
            # don't add any validation before this statement, it should work 
            # well if an excepetion occurs here, that means the validation that 
            # there is exactly one source for the multicast group is missing
            (src, traffic_info), = srcs.items()

            # source may be in a different connected component
            if src not in shortest_route_tree:
                continue

            queue = [src]

            # add every link to the returned information in a BFS manner
            while queue:
                from_node = queue.pop(0)
                for to_node, linkID in shortest_route_tree[from_node]:
                    if to_node == disabled_node or linkID == disabled_link:
                        continue
                    l = overview[linkID][from_node, to_node]
                    l['traffic'] += traffic_info['traffic']
                    l['bandwidth'] += traffic_info['bandwidth']

                    # if to_node is not destination, add it to the queue
                    if to_node in shortest_route_tree:
                        queue.append(to_node)

        return routes, overview

class PriorityQueue(object):
    def __init__(self, root):
        self.__heap = []
        self.traversed = {root} # root is already traversed

    def push(self, item):
        _, from_node = item[:2]
        if from_node not in self.traversed:
            heapq.heappush(self.__heap, item)

    def pop(self):
        while len(self.__heap) > 0:
            item = heapq.heappop(self.__heap)
            _, from_node = item[:2]
            if from_node not in self.traversed:
                self.traversed.add(from_node)
                return item
        return None

def cmp(a, b):
    # https://docs.python.org/3.0/whatsnew/3.0.html#ordering-comparisons
    return (a > b) - (a < b)
