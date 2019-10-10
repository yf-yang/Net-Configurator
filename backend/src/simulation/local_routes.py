# Author: yf-yang <directoryyf@gmail.com>

import heapq
from ..common import node, multicast_group
from collections import defaultdict
from boltons.dictutils import OrderedMultiDict
import pprint

import logging
logger = logging.getLogger(__name__)

class LocalPolicySimulation(object):
    """Simulate primary routes and local policy for any possible link failure.
    
    For each traffic, when it arrives at a switch, the switch will forward it to
    the outbound port according to a ARL table, which could be granted as a 
    mapping from destination MAC address and outbound port. If the link that
    connected to the port of a switch is broken, then before the global
    controller is notified, two endpoints of the link would first know that and
    make local decisions to forward the traffic to a backup port. In one link
    failure scenario, only one backup port (if there exist one) is enough, so
    on each switch, for the specific destination, no more than two ARL table
    entries is enough for local policies.

    This class is used to compute local policies based on the following 
    assumptions, constraints and rules:
    -   Between any two nodes, there should be exactly one link.
    -   When the switch detects a failed port, if route to the destination still
        exists without changing ARL table entries of other switches, it will
        use the port that belongs to the shortest route.
    -   If no such route exists, no backup port would be generated.
    -   Node failure will be ignored, which means the algorithm will not take
        care of that scenario.
    -   The algorithm will try to solve multicast redunt path, but in most of 
        the situations it can't.
    -   The algorithm is based on Dijkstra shortest path algorithm. We compare 
        new edges based on:
        1. number of hops (smaller first) 
        2. link speed (faster first)
        3. inbound port bit (smaller first)

    Note:
    -   The algorithm has some limitations, before we clearly define some rules
        for some scenarios, the algorithm will never take care of them because
        we are unable to handle some cases. For example:

        ###################################################################
        #                                                                 #
        #                                    DST                          #
        #                                     |                           #
        #                                     |                           #
        #                                     |                           #
        #                             6 ----- 7                           #
        #                             |       |                           #
        #                             |       |                           #
        #                             |       |                           #
        #                             5       2 ------┐                   #
        #                             |       |       |                   #
        #                             |       |       3                   #
        #                             |       |       |                   #
        #                             4 ----- 1 ------┘                   #
        #                                     |                           #
        #                                     |                           #
        #   1 ~ 7 - SWITCHES                  |                           #
        #                                    SRC                          #
        #                                                                 #
        ###################################################################

        I love this example because it clearly illustrate several issues to be
        resolved:
        -   It is possible, it only have 7 switches, we can even remove one 
            switch from 4, 5, 6 if the outbound port of link 13 comes first than
            outbound port of link 14 at switch 1.
        -   It illustrates that backup port may not exist. The primary route
            would be SRC - 1 - 2 - 7 - DST based on minimum number of hop rule,
            but if link 27 is broken, before some controller takes over, 1 and 3
            will keep forward the traffic to 2, so there is no backup port on
            switch 2. So, backup port may not exist.
        -   It illustrates that backup port may be different for link failure
            and node failure. For example, if link 12 is broken, clearly the
            backup port on switch 1 should be the port to switch 3. However, if
            switch 2 is broken, then the backup port changes to the port to
            switch 4. Note that simply add more backup ports will not work at
            all. Suppose there are 3 ARL table entries for the same destination
            on each switch, we can add another route similar to 1-3-2, say 
            1-8-2, then the problem still exists. So, node failure is not 
            supported.
    -   Multicast would be difficult to support, consider the following ring
        topology:

        ###################################################################
        #                                                                 #
        #                             ┌------ 3 ------ DST1               #
        #                             |       |                           #
        #                             5       |                           #
        #                             |       |                           #
        #                             |       2 ------ DST2               #
        #                             |       |                           #
        #                             4       |                           #
        #                             |       |                           #
        #                             └------ 1                           #
        #                                     |                           #
        #                                     |                           #
        #   1 ~ 5 - SWITCHES                  |                           #
        #                                    SRC                          #
        #                                                                 #
        ###################################################################

        In the primary route, switch 1 would forward the traffic to switch 2,
        then switch 2 will forward it to switch 3 and DST2, then switch 3 will
        forward it to DST1.
        Suppose now link 1 - 2 is broken, then 1 will instantly forward the
        packet to switch 4, then 5 and 3. However, 3 is not aware of the broken
        link, so the packet will not reacb switch 2.
        Such scenarios would be very common, so local redundant route may not be
        reliable.

    -   Multiple links between two switches should be supported. The reason that
        we haven't done that yet is because the behavior is undefined. The 
        second link could be used for load balancing or redundancy, we should do
        that after the behavior is defined.   
    """
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
        self.shortest_route_trees = {
            dst: self.get_shortest_route_tree(
                dst
            ) for dst in self.dst_src_combination
        }

    def gen_connected_components(self):
        """Generate every connected oomponents"""
        # Initialize every ETH node with a distinct number
        connected_components = OrderedMultiDict(
            (nodeID, i) for i, (nodeID, n) in enumerate(node.items())
            if n['protocol'] == 'ETH')
        untraversed = self.switches.copy()

        while untraversed:
            # choos a switch as the root of the connected component
            root = untraversed.pop()
            # and set its number as the id
            ccID = connected_components[root]
            # switches of the same connected_components
            cc_switch = {root}
            while cc_switch:
                # current node
                cur = cc_switch.pop()
                for l in self.adj[cur]:
                    _, neighbor, _, _, _, _, _, _, _ = l
                    connected_components[neighbor] = ccID
                    if neighbor in untraversed:
                        cc_switch.add(neighbor)
                        untraversed.remove(neighbor)

        self.connected_components = connected_components

    def gen_routes(self):
        """Generate shortest routes and redundant ports for all destinations.

        Returns 
        -------
        routes : dict
            Mapping from target to multiple routes.
        """
        routes = {
            udst: self.get_unicast_local_routes(
                udst
            ) for udst in self.dst_src_combination
        }
        self.unicast_routes = routes.copy()

        # we will ignore multicast routes since local route change can easily
        # trigger loops. Only global new routes can fix a failure case.

        return routes

    def get_shortest_route_tree(self, dst):
        """Get the shortest route tree with Dijkstra Algorithm.

        All the exist sources and switches in the connected component are
        included in the tree.

        Parameters
        ----------
        dst: str
            ID of destination node, which is the root of the tree.

        Returns
        -------
        tree: dict
            A map from each switch/source to a tuple of information including:
                - number of hops to the destination
                - ancestors
                - other route info including outbound port, parent and link
        """
        ccID = self.connected_components[dst]
        cc_nodes = set(self.connected_components.inverted().getlist(ccID))

        srcs = self.dst_src_combination[dst] & cc_nodes
        switches = self.switches & cc_nodes

        untraversed = srcs | switches

        pq = PriorityQueue(dst)

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
            ) in self.adj[dst]:

            pq.push(
                (
                    # order of links: 
                    #   weight (lower first)
                    #   speed (higher first)
                    #   inbound port (lower first)
                    (weight, -speed, to_port_bit), 
                    # source endpoint
                    from_node,
                    # weight, ancestors, outbound port, destination node, linkID
                    (weight, set(), (from_port, to_node, linkID)),
                )
            )

        tree = {}
        while untraversed:
            l = pq.pop()
            if l is None:
                # If some of the destinations are not reachable, then the loop
                # terminates
                raise Exception
            (cost, _, _), from_node, info = l
            _, ancestors, _ = info
            tree[from_node] = info
    
            untraversed.discard(from_node)

            # now the source becomes the new destination
            # add all links that go to the source to the priority queue
            new_dst = from_node

            # create a copy, then add the parent to ancestors
            ancestors = ancestors | {new_dst}
            for (
                weight, 
                from_node, to_node, 
                speed, 
                from_port, from_port_bit, to_port, to_port_bit,
                linkID
            ) in self.adj[new_dst]:
                pq.push(
                    (
                        # order of links: 
                        #   weight (lower first)
                        #   speed (higher first)
                        #   inbound port (lower first)
                        (cost+weight, -speed, to_port_bit), 
                        # source endpoint
                        from_node,
                        # weight, ancestors, route information
                        (cost+weight, ancestors, (from_port, to_node, linkID)),
                    )
                )

        return tree

    def get_unicast_local_routes(self, dst):
        """Generate primary and backup (if exists) ports for every switches.

        Parameters
        ----------
        dst: str
            ID of unicast destination node, which is the root of the tree.

        Returns
        -------
        tree: dict
            A map from each source to a tuple of two tuples, primary and backup
            route information, including:
                - outbound port
                - next hop node
                - linkID
        """
        shortest_route_tree = self.shortest_route_trees[dst]

        ccID = self.connected_components[dst]
        cc_nodes = set(self.connected_components.inverted().getlist(ccID))

        srcs = self.dst_src_combination[dst] & cc_nodes
        switches = self.switches & cc_nodes

        tree = {}
        for src in srcs:
            _, _, primary = shortest_route_tree[src]
            backup = ()
            tree[src] = (primary, backup)
        
        for sw in switches:
            _, _, primary = shortest_route_tree[sw]
            _, parent, _ = primary

            # get backup port if it exists
            candidates = []
            for (
                weight, 
                neighbor, _, 
                speed, 
                _, _, from_port, from_port_bit, 
                linkID
            ) in self.adj[sw]:

                # non switches are not considered
                if node[neighbor]['type'] != 'SWITCH':
                    continue

                cost, ancestors, _ = shortest_route_tree[neighbor]

                # first, it there is a valid backup port, set is as a candidate
                # a candidate should satisfy the following
                if (
                    # parent node is not considered
                    neighbor != parent and
                    #   descendant nodes is not considered
                    sw not in ancestors
                ):
                    candidates.append((
                        # order of candidate ports: 
                        #   weight (lower first)
                        #   speed (higher first)
                        #   outbound port (lower first)
                        (weight+cost, -speed, from_port_bit),
                        (from_port, neighbor, linkID)
                    ))

            # if there is at least one candidate, the shortest one is chosen
            if candidates:
                _, backup = min(candidates)

            # no valid backup port exist, then there could be two reasons
            # if the parent of the switch is the destination, and no redundant
            # path to that destination, then we don't need a backup port
            elif parent == dst:
                backup = ()

            # otherwise, we just forward the packet to a child of the node
            # in most scenarios it may be the optimal, but in some cases it is
            # not, anyway, we don't assure anything
            else:
                for (
                    _, 
                    neighbor, _, 
                    _, 
                    _, _, from_port, _, 
                    linkID
                ) in self.adj[sw]:
                    _, _, (_, parent, _) = shortest_route_tree[neighbor]
                    if parent == sw:
                        backup = (from_port, neighbor, linkID)
                        break

            tree[sw] = (primary, backup)

        return tree

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