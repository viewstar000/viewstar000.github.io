---
layout: post
title: 基于RabbitMQ构建ESB
author: lili01
categories: ['python']
tags: ['python', 'esb', 'soa', 'mq', 'rabbitmq']
published: True
description: ESB，全称Enterprise Service Bus，就是专门用于搭建总线型的拓扑结构的解决方案。而业界也已经有很用比较成熟的ESB中间可用。在SOA中，ESB也是一个非常重要组件。很多ESB中间件的核心就是一组消息队列，那么是否有可能利用已有的MQ中间件，搭建一个简单的ESB呢？本文就介绍了一种利用RabbitMQ搭建一个轻量级ESB方法。
---

## 什么是ESB

要解释什么是ESB，就要从模块的拓扑结构说起。当我们的业务逻辑不是很复杂时，模块的拓扑结构往往与业务逻辑模型相对应。这很好理解，也容易设计，比如很多检索系统。但是当我们的业务逻辑复杂到一定程度时，继续采用拓扑结构与业务模型相对应的方式就不太合适了，这会严重的限制系统的伸缩性并大提高运维的维度。

一个解决方案就是采用总线型的模块拓扑结构，所有的模块都挂统一的消息总线下，通过总线对消息的路由，实现模块间的通信。不同的路由规则就定义了不同的业务流模型。

ESB，全称Enterprise Service Bus，就是专门用于搭建总线型的拓扑结构的解决方案。而业界也已经有很用比较成熟的ESB中间可用。在SOA中，ESB也是一个非常重要组件。很多ESB中间件的核心就是一组消息队列，那么是否有可能利用已有的MQ中间件，搭建一个简单的ESB呢？本文就介绍了一种利用RabbitMQ搭建一个轻量级ESB方法。

## ESB有哪些基本功能

首先，需要明确一下本文的ESB要提供哪些功能。首先是作为一个ESB所必须备的两项功能：

 1. **服务发现**，包括服务的注册、发现、定位等
 2. **消息路由**，与服务发现相配合，将消息路由到相应的服务模块。我们的系统中将包括两类消息：
     1. RPC调用，即通常意义的模块间的功能调用，属于点对点的通信。
     2. 事件广播，同时向多个模块发送消息，属于一对多的通信。

除此之外，本文的ESB还提供了一个比较有特色的功能，即同步调用与异步调用间的转换。

## 基于RabbitMQ的ESB

### 服务发现

首先，对于被调用方，或者叫服务提供者，需要向ESB注册自己提供了哪些服务，以及自己的物理地址、端口等信息。

对于调用方，通过ESB，只需要知道一个简单的服务标识，就可以调用相应的服务，或者说与相应的服务提供者模块通信。

而这个里的关健就是如何把具体服务的模块与服务标识相关联，并且，同一个服务标识下可能有多个服务模块同时提供服务以提升系统的整体性能表现。

在RabbitMQ中, 很容易把服务标识与消息的TOPIC联系在一起，一个服务就是一个TOPIC。这样，向ESB添加一个服务，就是新建一个TOPIC以及一个与其对应的生产消费队列。向ESB注册一个服务提供者，就是在对应的TOPIC下的生产消费队列下添加一个消费者。服务的调用方，要调用某个服务的API，只需要向对应的TOPIC发布一条消息即可。同一个服务提供者的多个实例（部署）对应同一个生产消费队列下的多个消费者，这样就天然的实现了负载均衡。同时对调用者而言，则完全不需要了解一个服务下有多少个服务实例。

代码：注册服务

{% highlight python %}
log.info('Register %s' % (provider_class))
service_name        = provider_class.__service_name__
provider_name       = provider_class.__provider_name__
provider_instance   = provider_class()

channel = yield connection.channel()

# 声明一个TOPIC类型的Exchange，用于绑定当前服务的Topic
yield channel.exchange_declare(exchange='Service' + service_name, type='topic', durable=True)

# 声明一个生产消费队列，当前提供者的所有实际都是该队列的消费者
yield channel.queue_declare(queue='Provider' + provider_name, durable=True)

# 将队列绑定到当前服务的主题上
yield channel.queue_bind(exchange='Service' + service_name, queue='Provider' + provider_name, routing_key='Services.'+service_name+'.'+provider_name+'.#')
yield channel.basic_qos(prefetch_count=1)
{% endhighlight %}

代码：调用服务

{% highlight python %}
# 设置要调用的服务API
routing_key  = 'Services.'+self.__service_name__+'.'+self.__provider_name__+'.'+self.__api_name__

# 发起调用
yield self.channel.basic_publish(   exchange    = 'Service' + self.__service_name__, 
                                    routing_key = routing_key, 
                                    body        = body, 
                                    properties  = properties)
{% endhighlight %}

代码中使用了基于生成器的协程模式来处理异步操作，详见：[PEP 0342: Coroutines via Enhanced Generators](https://www.python.org/dev/peps/pep-0342/)

### 消息路由

有了TOPIC，消息的路由就不是什么大问题了，但对于不同类型的消息，还是需要有一些特殊处理。

#### RPC调用

RabbitMQ自身提供了一个`Exclusive Queue`和`Correlation Id`机制来支持RPC模式的消息传递。详见官方的上手文档：[Remote procedure call](https://www.rabbitmq.com/tutorials/tutorial-six-python.html)

不过出于性能考虑，实际使用时不可能像官方文档那样每次请求都新建一个`Exclusive Queue`，而是应该为每个调用进程实例建立一个`Exclusive Queue`，同时，为了方便异步操作，还是需要做一些简单的封装：

{% highlight python %}
class ResponseCallback(object):

    __callback_map  = {}
    __instance      = None
    __channel       = None
    __queue         = None

    @classmethod
    def get_instance(cls):

        if not cls.__instance:
            cls.__instance = cls()
        return cls.__instance

    @classmethod
    def get_response(cls, response_from, correlation_id = None):

        callback        = defer.Deferred()
        correlation_id  = correlation_id or str(uuid.uuid4())
        cls.__callback_map[(response_from, correlation_id)] = callback
        return response_from, correlation_id, cls.__queue.method.queue, callback

    @defer.inlineCallbacks
    def init(self, connection):

        ResponseCallback.__channel = yield connection.channel()
        ResponseCallback.__channel))
        ResponseCallback.__queue   = yield ResponseCallback.__channel.queue_declare(exclusive=True)
        ResponseCallback.__queue))
        yield ResponseCallback.__channel.basic_qos(prefetch_count=1)

        queue_object, consumer_tag = yield ResponseCallback.__channel.basic_consume(queue = ResponseCallback.__queue.method.queue, no_ack=True)
        l = task.LoopingCall(self.callback, queue_object)
        l.start(0)

    @defer.inlineCallbacks
    def callback(self, queue_object):

        self.log.info('ResponseCallback: wait for new message ...')
        channel, method, properties, body = yield queue_object.get()

        headers         = properties.headers
        response_from   = headers.get('response_from', '')
        correlation_id  = properties.correlation_id

        if (response_from, correlation_id) in ResponseCallback.__callback_map:
            callback = ResponseCallback.__callback_map[(response_from, correlation_id)]
            del ResponseCallback.__callback_map[(response_from, correlation_id)]
            callback.callback((properties, body))
        else:
            self.log.warn('ResponseCallback: callback for reponse from %s with %s not exists !' % (response_from, correlation_id))
{% endhighlight %}

#### 事件广播

事件与RPC的不同之外在于，RPC调用的消息只会有一个服务实际来响应，但事件消息可能有多个服务来响应，但每个服务只有一个实例可以响应。与RPC消息的处理方式类似，首先，为每个事件定义一个事件标识，每个事件标识对应一个TOPIC，不同的是，每个响应该事件的服务都有一个独立生产消费队列与该事件的TOPIC绑定，同一个服务的多个实例作为该服务对应的的事件响应队列的消费者。

代码：注册事件响应者

{% highlight python %}
# 遍历当胶服务提供者的事件响应器
for name, attr in provider_class.__dict__.iteritems():
    if callable(attr) and hasattr(attr, 'slots') and attr.slots:
        for (model_name, signal_name) in attr.slots:
            log.info('RegisterSignalSlot: %s.%s -> %s' % (model_name, signal_name, attr))

            # 声明一个TOPIC类型的Exchange，用于绑定该分类下的事件队列
            yield channel.exchange_declare(exchange='ServiceModel' + model_name, type='topic', durable=True)

            # 将当前服务的队列与事件主题绑定
            yield channel.queue_bind(exchange='ServiceModel' + model_name, queue='Provider' + provider_name, routing_key='Signals.'+model_name+'.'+signal_name)

            # 在绑定的主题中增加提供者的ID，用于事件发送方指定接收者
            yield channel.queue_bind(exchange='ServiceModel' + model_name, queue='Provider' + provider_name, routing_key='Signals.'+model_name+'.'+signal_name+'.'+provider_name)
{% endhighlight %}

代码：触发事件

{% highlight python %}
# 要触发的事件标识
routing_key  = 'Signals.'+self.__model_name__+'.'+self.__signal_name__

# 触发事件
yield self.channel.basic_publish(   exchange    = 'ServiceModel' + self.__model_name__, 
                                    routing_key = routing_key, 
                                    body        = body, 
                                    properties  = properties)
{% endhighlight %}

### 调用模式的转换

有时，服务提供的接口可能是异步方式调用的，但调用方希望以同步的方式调用，有时则可能正好反过来。借助于RabbitMQ，这现同步与异步调用方式转换也不是什么难事了。

对同步接口与异步方式调用的情况，实现起来比较简单，只需要加一层代理即可。

而对于服务以异步方式提供，调用方以同步方式调用的情况，就要相对复杂一些了。通常，异步调用的接口都会充许传入一个回调参数，以便于当任务异步执行完成后可以将结果发送回调用者。利用这一点，可以在ESB上集成一个默认的回调代理，当调用异步服务时，传入回调代理的地址，同时附加上`Exclusive Queue`和`Correlation Id`参数。回调代理收到消息后，只需要把消息转发到对应的`Exclusive Queue`并附上`Correlation Id`就可以了。具体的实现过程，可以参考完整的工程代码。

## 完整代码

完成的代码托管在GITHUB上，地址：<https://github.com/viewstar000/RabbitESB>

------------------
&copy; 本文版权所有，转载引用请注明出处