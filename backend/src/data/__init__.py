# Author: yf-yang <directoryyf@gmail.com>
from .state_manager import StateManager
from .base import BaseDataManager

# Initialize data
sm = StateManager()
node = sm.node
link = sm.link
traffic = sm.traffic
multicast_group = sm.multicast_group

from .api import blueprint