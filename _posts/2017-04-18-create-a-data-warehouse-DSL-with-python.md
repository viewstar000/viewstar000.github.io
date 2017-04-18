---
layout: post
title: 基于PYTHON创建一个数据仓库DSL
categories: python
tags: ['MDD', 'python', 'DSL']
published: True
description: 在之前的BLOG[从可编程性到模型驱动到DSL]中已经提到，通过合理的使用DSL，可以有效的提高开发效率，那么针对数据仓库建设这个具体场景，如果构建一个有效的DSL呢？
---

在之前的BLOG[从可编程性到模型驱动到DSL]中已经提到，通过合理的使用DSL，可以有效的提高开发效率，那么针对数据仓库建设这个具体场景，如果构建一个有效的DSL呢？

首先看一下一个典型的数仓的逻辑结构，如下图所示：

![数据仓库内的处理逻辑实际上是一个分层的有向网络,网络一侧是数据源，另一个侧是数据的计算结果,网络中是结点就是各种数据模型，以及其对应的ETL]({{ site.url }}/images/2017-04-18/MDD/p1.png)

![数据结点]({{ site.url }}/images/2017-04-18/MDD/p2.png)

将数据结点抽象为一个模型：

![通过模型化的方式来描述一个数据结点]({{ site.url }}/images/2017-04-18/MDD/p3.png)

将模型中的元素映射到PYTHON语法：

![使用基于PYTHON语法的DSL来定义模型]({{ site.url }}/images/2017-04-18/MDD/p4.png)

最后整体的结构：

![DSL执行框架]({{ site.url }}/images/2017-04-18/MDD/p5.png)

------------------
&copy; 本文版权所有，转载引用请注明出处
