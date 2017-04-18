---
layout: post
title: 又见函数式编程
categories: python
date: 2015-02-18 15:23:10
tags: python functional DSL 高阶函数
description: 本文不打算完整的介绍什么是函数编程，仅仅是笔者在实践中总结的一点感想，以及如何在PYTHON中实现一个简单的DSL以支持一些函数式编程的高级特性。
---

本文不打算完整的介绍什么是函数编程，仅仅是笔者在实践中总结的一点感想，以及如何在PYTHON中实现一个简单的DSL以支持一些函数式编程的高级特性。

什么是函数
---------------

函数式编程的函数的定义来自于数学中的函数的定义，而其在代码中的表现形式与一般的编程语言中的函数定义没有太大的差别，比如在PYTHON中：
{% highlight python %}
def a(x, y):
    return x + y
{% endhighlight %}

在典型的函数式编程语言（Lisp, Scheme, ...）中是不充许在函数内定义静态变量的，这也就意味着，所有的函数都是无状态，换句话说，只要输入的参数是确定的，结果也就是确定的。
另一方面，典型的函数式语言中也不充许对参数做修改，这也就不存在共享内存的问题，所以在多线程领域，函数式编程有着自己得天独厚的优势。

那么问题来了，如果函数都是无状态的，那么，那些依懒于状态才能实现的功能该如何做呢？接下来，有请“闭包”大神。

闭包——有状态的函数
------------------

先来看一个简单例子，如何在用函数式编程实现一个累加计数器。首先是计数器的定义部分，代码如下：
{% highlight python %}
def counter(num = 1):
    u"定义累加器，num为启始数字"

    def inc(step = 1):
        u"定义累加函数，step为累加的步长"

        return  counter(num + step) # 从外部引用num变量，也就是闭包

    return num, inc # 返回一个二元组
                    # 元组的第一个元素是累加器的当前值
                    # 元组的第二个元素是累加函数
                    # 这也是在函数式编程中最重要的特征之一
                    # ——函数可以赋值给变量，并通过参数、返回值进行传递
{% endhighlight %}

接下来是计数器的使用部分：
{% highlight python %}
num, inc = counter() # 初始化累加器
while num < 10:
    print num, 
    num, inc = inc() # 进行累加操作
{% endhighlight %}

输出结果：
{% highlight python %}
1 2 3 4 5 6 7 8 9
{% endhighlight %}

对于闭包，不同语言的实现方式会有所有不同，但总的来说，都是在函数嵌套定义时，内层的函数可以从外层函数“偷取”一份上下文的快照，保存到自己的调用栈中。
而对于上面的例子，熟悉设计模式的人一定会觉得哪里有点眼熟，所以，不妨看下用面向对像的方式如何实现同样的功能。

首先还是计数器的定义部分：
{% highlight python %}
class Counter(object):
    u"""累加计数器类

        属性: num, 计数器当前值
        方法: inc, 累加函数
    """

    def __init__(self, start = 1):
        u"构造函数"

        self.num = start 

    def inc(self, step = 1):

        self.num += step
{% endhighlight %}

接下来是使用部分：
{% highlight python %}
counter = Counter() # 创新计数器实例，在PYTHON中没有new关键字
                    # 因为PYTHON中默认使用工厂模式，当声明了一个类后，就相当于隐式的声明一个与类名相关的工厂函数
while counter.num < 10:
    print counter.num,
    counter.inc()   # 进行累加操作
{% endhighlight %}

输出结果：
{% highlight python %}
1 2 3 4 5 6 7 8 9
{% endhighlight %}

对照两组代码，第一组代码中定义的counter函数就相当于工厂函数，返回的二元组，就相当于创建的一个匿名的类实例。
简而言之，闭包，可以看做是*函数的工厂*，通过这个工厂，可以创建出*有状态的函数*，而有状态的函数，又可以看做是*对像实例*。

写到这里，不得不提一下编程语言界的一朵奇葩——JAVASCRIPT，其实笔者也是不久前才了解到这门语言的奇葩之处，明明是一门函数式语言，却披着面向对像的外衣，而上面的例子，恐怕也正是这门语言当初在设计时的基础理念之一，只不过，JAVASCRIPT中还提供了object类型和原型这样的机制来降低面向对像的难度，使代码更加的直观。当然，这个直观是相对的。


将函数进行到底
---------------

回到第一节里的面的例子，我们知道，在函数式编程中，函数的参数可以是普通的变量，也可以是另一个函数，那么对于第一节的例子，如果传入的参数也是函数，那么会发生什么呢？比如：
{% highlight python %}
def a(x, y):

    return x + y


def b(x, y):

    return x * y
    

print a(1, b)
{% endhighlight %}

当然了，这段代码在PYTHON下是无法运行的，而在像scheme这样的完备的函数式语言中，这段代码是可以被执行的，并且会返回一个新的函数，新的函数相当于：
{% highlight python %}
def new_func(x, y):

    return 1 + ( x * y )

{% endhighlight %}

上面的例子实际是一个参数绑定的过程，而这种绑定部分参数，生成一个新的函数的特性被称之为高阶函数。PYTHON本身不支持这种特性，但可以通过lambda表达式支持部分特性，比如参数与变量的绑定，但无法实现参数与函数的绑定。那么问题来了，在PYTHON下，能否利用其高度的动态特性来模拟完整的高阶函数特性呢？接下来篇副，笔者将在PTYHON基础上实现一个简单的DSL，以实现完整的高阶函数特性。

### 语法定义

由于是基于PYTHON的DSL，所以直接复用了PYTHON的基本语法，但增加了对高阶函数的定义，简单启见，后文用HoFunc表示高阶函数，Value表示高阶函数的参数，高阶函数支持的操作仅限最基本的+、-、*、/四种。

HoFunc的语法定义表示为：
{% highlight ebnf %}
HoFunc  = F(PyFunc, Value, Value, ..., name = FuncName); 
HoFunc  = Value OPT Value;
HoFunc  = "@FUNC"
          PythonFunctionDefine;
Value   = HoFunc | V(VarName) | PythonObject;
OPT     = "+" | "-" | "*" | "/";
PyFunc  = PythonCallableObject;
{% endhighlight %}

为了使用起来方便，还定义了一个“语法糖”：
{% highlight python %}
def apply(func, *args):
    
    return F(func, *args, name = func.__name__)
{% endhighlight %}

在PYTHON中+、-、*、/这样的基本操作都可以表示为函数调用，所以，核心的语法定义可以规纳为两条，即：
{% highlight ebnf %}
HoFunc  = F(PythonCallableObject, Value, Value, ..., name = FuncName); 
Value   = HoFunc | V(VarName) | PythonObject;
{% endhighlight %}
其它的语法都可以认为是为了方便使用而定义的语法糖。

每个HoFunc实例还支持```invoke()```和```format()```两个方法，前者用于计算最终结果，后者用于输出格式化后的语法树。

下面是一些具体使用的示例：
{% highlight python %}
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
print '-----------------------------------------------------------------------'
print a-b/c
{% endhighlight %}

### 语法树生成

在由上面的的代码生成的语法树中包含两类结点，F结点，用以表示HoFunc，V结点，用以表示Value，其代码的定义如下:
{% highlight python %}
class V(object):
    
    def __init__(self, name = None):
        
        self.__name__ = name
    

class F(object):
    
    def __init__(self, *args, **kwargs):
        
        self.opt = args and args[0] or None
        self.params = args[1:]
        self.__name__ = kwargs.get('name', None)
{% endhighlight %}

其中F对应的就是HoFunc结构，它的opt属性对应的就是PyFunc结构。它的params属性中保存的就是Value结点，它的元素可能是另一个F实例，也可能是一个V实例，也可能是一个标准的PYTHON对象。

接下来就是如何将上一节中的示例生成完成的语法树结构，其实在语法定义中已经可以看到一些端倪，比如语法结构：
{% highlight ebnf %}
HoFunc  = "@FUNC"
          PythonFunctionDefine;
{% endhighlight %}
对应的示例：
{% highlight python %}
@FUNC
def a(x, y):
    
    return x + y

@FUNC
def b(x, y):
    
    return a * 2
{% endhighlight %}

只要在修饰器```@FUNC```中实现相应的生成逻辑即可。同理，对于语法结构：
{% highlight ebnf %}
HoFunc  = F(PyFunc, Value, Value, ..., name = FuncName); 
{% endhighlight %}
对应的生成逻辑就是F的构造函数。

为了便于后续的语法树的执行，在生成的过程中还需要对变量进行动态的绑定与归并，也是F对象的```collect_vars()```方法。

具体的生成逻辑可以参考完整的代码：[hf.py]({{ site.url }}/downloads/hf.py)

### 执行

最后的执行过程就是对生成的语法树进行深度优先遍历，逐一计算每个结点的值，最后根结点的值，就是整个HoFunc结构的值。对于语法树中的F结点，其opt是一个PYTHON的Callable对象实例，所以其计算逻辑就是先计算params的值，最后将params值给opt属性执行即可。对于语法树中的V结点，如果PYTHON对象，直接返回该对象即可。如果是V对象，则需要在变量表中进行查找。

最后的执行结果：
{% highlight c %}
f_add{f_{v_}, f_{v_}}
f_add{f_{1}, f_{2}}
3
-----------------------------------------------------------------------
f_b(v_x, v_y) { mul, 
    f_a(v_x, v_y) { add, 
        _x(v_x){v_x},
        _y(v_y){v_y},
    },
    2,
},

6
-----------------------------------------------------------------------
f_b(v_y) { mul, 
    f_a(v_y) { add, 
        _x(){1},
        _y(v_y){v_y},
    },
    2,
},

6
-----------------------------------------------------------------------
f_b() { mul, 
    f_a() { add, 
        _x(){1},
        _y(){2},
    },
    2,
},

6
-----------------------------------------------------------------------
f_(v_x, v_y) { mul, 
    f_a(v_x, v_y) { add, 
        _x(v_x){v_x},
        _y(v_y){v_y},
    },
    2,
},

6
6
-----------------------------------------------------------------------
f_d(v_x, v_y) { add, 
    f_sin(v_x, v_y) { sin, 
        f_b(v_x, v_y) { mul, 
            f_a(v_x, v_y) { add, 
                _x(v_x){v_x},
                _y(v_y){v_y},
            },
            2,
        },
    },
    f_a(v_x) { add, 
        _x(){3},
        _x(v_x){v_x},
    },
},

3.7205845018
-----------------------------------------------------------------------
f_d(v_y) { add, 
    f_sin(v_y) { sin, 
        f_b(v_y) { mul, 
            f_a(v_y) { add, 
                _x(){1},
                _y(v_y){v_y},
            },
            2,
        },
    },
    f_a() { add, 
        _x(){3},
        _x(){1},
    },
},

3.7205845018
-----------------------------------------------------------------------
f_d() { add, 
    f_sin() { sin, 
        f_b() { mul, 
            f_a() { add, 
                _x(){1},
                _y(){2},
            },
            2,
        },
    },
    f_a() { add, 
        _x(){3},
        _x(){1},
    },
},

3.7205845018
f_sub{f_add{f_{v_x}, f_{v_y}}, f_div{f_mul{f_add{f_{v_x}, f_{v_y}}, 2}, f_mul{f_add{f_{v_x}, f_{v_y}}, 2}}}
[Finished in 0.0s]
{% endhighlight %}

### 小结

在实践中，需要使用高阶函数的时候并不多，大多数时候lambda表达式就已经够好用了，本文只是单纯为了有趣而作，同时也演示了设计并实现一个DSL的一般步骤。

-----------------
&copy; 本文版权所有，转载引用请注明出处

