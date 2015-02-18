#! /usr/bin/env python
#coding=utf-8

import math
import operator


class V(object):
    
    def __init__(self, name = None):
        
        self.__name__ = name
        
    def __repr__(self):
        
        return "v_%s" % (self.__name__ or '')
    

class F(object):
    
    def __init__(self, *args, **kwargs):
        
        self.opt = args and args[0] or None
        self.params = args[1:]
        self.__name__ = kwargs.get('name', None)
        if not self.opt and not self.params:
            self.params = [V(self.__name__)]
        self.collect_vars()
        
    def collect_vars(self):
        
        self.vars = []
        for param in self.params:
            if isinstance(param, V):
                if param not in self.vars:
                    self.vars.append(param)
            elif isinstance(param, F):
                for var in param.vars:
                    if var not in self.vars:
                        self.vars.append(var)
                    
    def __add__(self, other):
        
        return F(operator.add, self, other)

    def __sub__(self, other):

        return F(operator.sub, self, other)
    
    def __mul__(self, other):
            
        return F(operator.mul, self, other)

    def __div__(self, other):

        return F(operator.div, self, other)
    
    def __call__(self, *args):
        
        assert len(self.vars) >= len(args) , "Args is too many, most %s" % len(self.vars)
        var_map = dict(zip(self.vars, args))
        return self.deep_copy(var_map);
        
    def __repr__(self):
        
        return "f_%s{%s}" % (
            self.opt and self.opt.__name__ or '', 
            ', '.join(map(repr,self.params)))
            
    def format(self, level = 0, indent = 4):
        
        if self.opt == None:
            return ' ' * (level * indent) + '_%s(%s){%s},\n' % ( 
                    self.__name__ or '', 
                    ', '.join(map(repr, self.vars)),
                    ', '.join(map(repr,self.params)))
                    
        result = ' ' * (level * indent) + 'f_%s(%s) { %s\n' % ( 
                    self.__name__ or '', 
                    ', '.join(map(repr, self.vars)), 
                    self.opt and self.opt.__name__ + ', ' or '')
        for param in self.params:
            if not isinstance(param, F):
                result += ' ' * ((level + 1) * indent) + repr(param) + ',\n'
            else:
                result += param.format(level + 1, indent)
        result += ' ' * (level * indent) + '},\n'
        return result
            
    def deep_copy(self, ref_map):
        
        if self.opt == None:
            if self.params:
                var = self.params[0]
                var = ref_map.get(var, var)
                if var == None:
                    return self
                if isinstance(var, V):
                    return F(None, var, name = var.__name__)
                if isinstance(var, F):
                    return var
            else:
                return None
            
        copy_params = []
        for param in self.params:
            if isinstance(param, F):
                copy_params.append(param.deep_copy(ref_map))
            elif isinstance(param, V):
                var = ref_map.get(param, param)
                if var == None:
                    copy_params.append(param)
                else:
                    copy_params.append(var)
            else:
                copy_params.append(param)
        
        return F(self.opt, *copy_params, name = self.__name__)
    
    def deep_invoke(self, ref_map):
        
        if self.opt == None:
            if self.params:
                var = self.params[0]
                val = ref_map.get(var, var)
                if val == None:
                    return var
                else:
                    return val
            else:
                return None
            
        invoke_params = []
        for param in self.params:
            if isinstance(param, F):
                invoke_params.append(param.deep_invoke(ref_map))
            elif isinstance(param, V):
                var = ref_map.get(param, param)
                if var == None:
                    copy_params.append(param)
                else:
                    copy_params.append(var)
            else:
                invoke_params.append(param)
        
        return self.opt(*invoke_params)
    
    def invoke(self, *args):
        
        assert len(self.vars) == len(args) , "Need %s args" % len(self.vars)
        var_map = dict(zip(self.vars, args))
        return self.deep_invoke(var_map) 


def FUNC(func):
    
    args = func.func_code.co_varnames
    f_args = map(lambda n: F(None, V(n), name=n), args)
    f_func = func(*f_args)
    f_func.__name__ = func.__name__
    return f_func


def apply(func, *args):
    
    return F(func, *args, name = func.__name__)
    


@FUNC
def a(x, y):
    
    return x + y

@FUNC
def b(x, y):
    
    return a * 2


c = a * 2   

@FUNC
def d(x, y):
    
    return apply(math.sin, b(x, y)) + a(3, x)

print F() + F()
print (F() + F())(1,2)
print (F() + F())(1,2).invoke()
print '-----------------------------------------------------------------------'
print b.format()
print b.invoke(1, 2)
print '-----------------------------------------------------------------------'
print b(1).format()
print b(1).invoke(2)
print '-----------------------------------------------------------------------'
print b(1,2).format()
print b(1,2).invoke()
print '-----------------------------------------------------------------------'
print c.format()
print c.invoke(1,2)
print c(1,2).invoke()
print '-----------------------------------------------------------------------'
print d.format()
print d.invoke(1,2)
print '-----------------------------------------------------------------------'
print d(1).format()
print d(1).invoke(2)
print '-----------------------------------------------------------------------'
print d(1,2).format()
print d(1,2).invoke()

print a-b/c

