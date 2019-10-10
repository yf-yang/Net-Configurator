# Author: yf-yang <directoryyf@gmail.com>

import time

def __session_id():
    # use current time in seconds as id
    n = int(time.time())
    return __base62encode(n)

__base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
# 62 ** 5 / 86400 / 365 = 29 years
__period = 62 ** 5 

def __base62encode(n):
    if n == 0:
         return ''
    # make session key as short as possible, but it is unique in 30 years period
    n = n % __period 
    base = len(__base62)
    div, mod = divmod(n, base)
    return __base62encode(div) + __base62[mod]

session_key = __session_id()

CACHE_DIR = '/cache'

DATA_TYPES = ("node", "link", "traffic", "multicast_group")

from .data import StateManager
from .data import sm, node, link, traffic, multicast_group