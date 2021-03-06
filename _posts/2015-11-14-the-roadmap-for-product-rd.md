---
layout: post
title: 产品RD的成长之道
categories: []
tags: ["成长"]
published: True
description: 这里的产品RD指的是以负责产品实现为主要工作的软件研发工程师，他们的工作通常都是通过组合各种已有的开发平台、框架、组件，实现产品经理的各种需求，向用户交付各种软件产品。这个过程中往往并不需要对各种平台、框架、组件的技术细节有特别深入的了解，在比较成熟的公司里，他们往往也没有特别多的机会去参与各种平台、框架、组件的开发。那么在这种情况，产品RD的技术价值如何体现，又该如何成长？
---

## 前言

这里的产品RD指的是以负责产品实现为主要工作的软件研发工程师，他们的工作通常都是通过组合各种已有的开发平台、框架、组件，像搭积木一样实现产品经理的各种需求，向用户交付各种软件产品。这个过程中往往并不需要对各种平台、框架、组件的技术细节有特别深入的了解，在比较成熟的公司里，他们往往也没有特别多的机会去参与各种平台、框架、组件的开发。那么在这种情况，产品RD的技术价值如何体现，又该如何成长？最近，不只一位同事向我提出了这样的问题，所以决定写上一篇文章来总结一下自己对这个问题的看法，希望能给有同样疑问的攻城狮们一点点帮助。

虽然同为软件攻城狮，但大家还是会细分出许多不同的领域和技术方向，而在比较大的团队里，大家会依据技术方向的不同有着不同的分工。比如有些人专注于各种基础平台、公共框架、组件的开发，有些人会专注于各种策略、算法的研究、优化，有些人则专注于产品与业务需求的实现。但在我看来，无论是哪种技术方向和分工，所要解决的终极问题都是一样的，那就是**架构**。

## 什么是架构

架构这个词本身比较抽像，笔者水平有限，一时也找不到个能用一两句来准确描述的方法。但有一点的可以肯定的，那就是对于一个软件系统，从不同的角度来看，他的架构是不一样的。

### 一个典型的统计监控系统

以一个假想的统计监控系统为例，它的架构很可能会被这样描述

#### 业务模型

它的业务模型可能是这样：

![业务模型]({{ site.url }}/images/2015-11-14/p1.png)

它描述了系统中有哪些业务实体，实体间如保关联以实现业务需求

#### 模块拓扑

它的模块拓扑可能是这样：

![模块拓扑]({{ site.url }}/images/2015-11-14/p2.png)

它描述了系统中有哪此模块，以模块间如保通信。

#### 算法模型

它的算法模型可能是这样:

![算法模型]({{ site.url }}/images/2015-11-14/p3.png)

它描述了如保对收集到的数据进行处理并最终生成可能被用户使用的报表

### 架构的视图

看到这里，是不是觉得跟UML里的各种视图有着异曲同功之处？事实上，UML本质上就是一种软件工程设计的描述语言，而软件系统架构的设计也是软件工程中非常重要的部分，当年设计UML的人自然要将其考虑其中。

那么为什么要这么分为这么多种视图呢？原因嘛，只能说迄今为止人们还没有找到一种可以在一张图中把所有架构设计问题都能描述清楚的方法。所以只好跟据问题的类型，将系统分解为的不同视图，再加以描述和解决。就如同物理学的大统一理论，很多学者都开始放弃寻找单一理论的努力，而是导找一个被称为M理论的理论簇，用以从不同角度来描述大统一理论，呃，好像有点跑题了。

## 技术团队的分工

正由于解决的问题的类型不同，也就催生出了团队内的不同分工，不同分工的攻城狮在不同架构视图解决着各种不同的问题。

### 业务模型

在这个视图下工作的工程师也就是我们标题中所说的产品RD了。在这个视图下，最核心的问题就是对业务需求的抽象。通过抽象，构建出合理模型，并在此基础上实现产品、业务需求。

 *  主要挑战：需求分析、对象解耦、代码腐败
 *  主要工具：设计模式、模型驱动开发、领域驱动开发、MVC、SOA、……
 *  终极目标：可维护性、可扩展性、迭代效率

### 模块拓扑

在这个视图下，核心的问题是性能和运维。通过合理的模块拆分和组合，使系统的性能满足业务的需求，同时使用系统易于运维。在这个过程中往往还会涉到的一些公共组件或基础平台的建设，以及对系统底层技术的应用。

 *  主要挑战：大数据、大呑吐、响应时间、系统资源占用、服务运维
 *  主要工具：操作系统、高性能IO、分布式集群、……
 *  终极目标：可伸缩性、自动化运维

### 算法模型

在这个视图下，核心的问题是算法的优化。在一些场景下，算法本身的好坏就产品的表现至关重要，比如搜索引擎、智能推荐、图像识别、语间识别等等。这时就是算法工程师施展拳脚的时候了。在不同领域下，算法的好坏有不同的衡量方法，也有着不同的挑战，这里就不一一列举了。

## 工程师的成长之路

工程师的成长过程有很多不同的阶段，不同的视角下，阶段的划分方法也不尽相同，在这里，只是简单的分为三个阶段：

   1. **学徒**：这时，我们初出茅庐，最主要的任务就是积累，不论是知识、经验、方法。此时，我们还不需要太多的考虑架构问题，只要能把任务完成就行。
   2. **成师**：这时，我们已经能独挡一面，在架构设计上已有所造诣，最重要的是能够在系统架构的某个视图下驾轻就熟，开始形成自己的理论体系。
   3. **成家**：此时，我们已经不仅仅局限系统架构的单一视图，需是能够从全局去把握整个架构，并且已经形成了自己的一套比较完备理论体系。

在我的身边，很多人都处于从学徒到成师的过渡过程中，也是对未来发展方向最为困惑的时候，希望这篇文章成对读者有所帮助。

------------------
&copy; 本文版权所有，转载引用请注明出处




