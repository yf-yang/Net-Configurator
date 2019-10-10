# Author: yf-yang <directoryyf@gmail.com>
import abc

class SingletonMeta(type):
    """Metaclass for Singleton design pattern"""
    __instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls.__instances:
            cls.__instances[cls] = super(SingletonMeta, cls).__call__(*args, **kwargs)
        else:
            cls.__instances[cls].__init__(*args, **kwargs)
        return cls.__instances[cls]

class Singleton(SingletonMeta, abc.ABCMeta):
    pass