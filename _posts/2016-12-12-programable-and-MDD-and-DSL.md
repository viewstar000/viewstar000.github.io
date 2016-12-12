---
layout: post
title: 从可编程性到模型驱动到DSL
categories: ['arch']
tags: ['arch', 'MDD']
published: True
description: 
---

## 从数据研发说开去

最近开始接手一些数据开发的工作，也接触了一些数据开发方面的工具，惊讶的发现似乎大部分工具都提供了丰富的人机交互界面，确没有提供很好的API和工程管理能力。这可能与数据开发的特殊性有关，必竟这些工具很多时候是面向非专业开发人员的。但这就导致了当工程模型较大时，由于缺少版本管理能力，使得项目的维护成本不断攀升。而当需要将这些工个与现有架构集成时，就变得更是难上加难了。简单来说，这样的工个虽然对人友好，但对机器不友好，也就是可编程性很差。

如果换一个思路，将人机交互界面与系统操作分离，人机界面不是直接触发系统操作，而是向IDE一样，生成一份结构良好的工程配置。将系统操作抽像为一个执行引擎，就像解释器一样，通过加载工程配置，完成对应的操作。整个过程如下所示：

<div class="mermaid">
graph LR;
    人机界面-->系统操作;
</div>

<div class="mermaid">
graph LR;
    人机界面-->工程配置;
    工程配置-->执行引擎;
    执行引擎-->系统操作;
</div>

这样的拆解看似使工具变得更加复杂了，但实际上，它使用得开发人员可以直接通过API调用执行引擎来完成原来只能通过人机界面由人工来完成的操作，换句话说，原来必须由人来完成的操作，现在可以自动化了。

<div class="mermaid">
graph LR;
    人工-->人机界面;
    人机界面-->工程配置;
    机器-->工程配置;
    工程配置-->执行引擎;
    机器-->执行引擎;
    执行引擎-->系统操作;
</div>

## 什么是可编程性

关于什么是可编程性，似乎也不容易给一下简单明了的定义，它并不是简单有无API，是否可通过SHELL调用这样的简单描述能说清楚的，所以，这里给几个例子，让读者自己感受一下吧

### 火到不要不要的docker

从实现原理上来说，docker所使用技术没有什么太多的新奇之处，不论是cgroup、namespace，还是aufs，都不是docker首创的，跟之前的虚拟化方案相比，docker最大的进步在于dockerfile。

在以往，要构建一个虚拟机镜像，通过都需要手工操作，即便是可以使用一些自动化脚本，脚本的编写、维护都不是一件轻松的事情。对镜像的灵活定制就更是想都别想了。而dockerfile的出现，使得构建一个镜像与构建一个应用一样的简单方便。很多时候，写一个dockerfile, 可能比写一个makefile还简单。现在，环境构建不在是一件烦锁恼人的工作，反而显得轻松而愉快。

### 可爱的SPARK

在大数据计算领域，不论是经典的mapreduce，还是新兴的流式计算，都有非常多的框架可供选择，hadoop、hive、storm……可以列出长长的一串。但就个人而言，一直都对spark偏好有佳，Why？因为在spark里面，所有的工作都可以通过api来完成，你不需要一个复杂的任务调整系统管理MR任务间依懒，也不需要一个调度框架去拼装、执行一坨一坨的SQL，也不需要一个单独的配置文件来管理数据的拓补。你需要的，只是一个定义良好的代码规范。通过spark构建的数据系统，可以组织成一个规范良好的工程项目，并利用已有各种工程管理手段进行良好的管理。而不是像其它技术那样，由一堆松散的代码片段组织的工程，必须依懒于特定的工具才能得于执行和维护。

### 小结

虽然，笔者无法给可编程性提供一个简单、精练的定义，但是从上面的案例可以看出更好的可编程性可以给我们带来的益处。当然，有利必有弊，简单总结一下，如下表所示：

| 可编程性 | 优点               | 缺点                | 
| ------- | ----------------- | ------------------ | 
| 高      | 工程化程度高、管理成本低，易于自动化，平台工具依懒性低，易于集成 | 学习成本高、人员素质要求高 |
| 低      | 学习成本低，人员素质要求低 | 工程管理成本高，不易于自动化，平台工具依懒性高，不易于与其它平台集成 | 

_**注**：虽然高可编程性，往往意味着高学习成本，但同时也意味着其容易与各类可视化工具集成，从而大大降低其学习成本和人员要求。_

## MDD是个什么鬼

还记得软件工程课程中的UML吗？当需求确定后，首先要做的就是识别出需求中的业务对象、每个对象具备的属性、操作，以及对象与对象之间的关系。UML就是用来将对象、属性、操作、关系通过图形化的方式表达出来的语言，而通过UML绘制出的图表，也就是所谓的软件模型了，这也是UML名字——统一建模语言（Unified Modeling Language）——的由来。

有了模型之后，接下来要做的就是按照模型中的定义，转化为代码中的class、member、method，然后调式、测试等，最终交付出相应的软件产品。在UML发展的巅峰时期，还出现很多可以根据UML图自动生成代码框架、单测框架的工具，在一定程度上提高了开发效率。而这种先针对需求建模，再将模型映射到对应的代码的方法，就是典型的MDD了，也就是模型驱动开发（Model Driven Develop）。

随着敏捷开发的兴起，开发过程中很少再有专门的时间去绘制大而全的UML图了。但是在特定的场景下，MDD并没有随着UML被一起冷落掉，当下的被广泛应用的MVC、MVVM、MVP等架构思想基础都是MDD，而几乎所有MV*开发框架都会标配的ORM框架，更是MDD思想最直接的体现。

说了这么多MDD，它跟可编程性又有什么关系呢？首先说模型，它原本是一个很抽象的概念，很显然，它是不可编程的。而MDD的第一步就是将模型实体化，变成看得见、摸得着的形式，不论是用XML，还是用代码来描述的模型，它都能够被代码所解析、加工、执行。在MDD中，模型从一个完全抽象的，不可编程的概念，变成一个有实际存在的，可编程、可操作的对象。而这也是MDD思想的核心，从些类图、流程图、ER图等等，不再仅仅是用于指导编码的文档，而是可以被执行的对象了。

## DSL又是什么鬼

DSL的本意是领域特定语言，源自领域驱动开发思想。其它核心思想就是针对特定范围的需求（领域），为其对针对性的设计一个形式语言。由于其针对特定的问题进行了优化设计，所以在解决这类问题时，它可以做到比通用语言更加简洁、高效、易维护。最常见的例子就是SQL了，它用途非常单一，就是用于关系型数据的查询。

实现DSL的方式主要有两种，一种是利用flex/yacc、eclipse text之类的工具，从头构建一个编译器或解释器。这种方式最大的问题就是开发成本非常高。还有一种方式则要简单得多，就是基于已有通用语言，通过框架、API、操作符重载等手段，封装出新的语义操作，从而实现DSL，典型的代表——各种ORM框架。

那么问题来了，同样都是DSL，即然SQL已经足够各种数据库相关的需求了，为什么还要有ORM？原因还是可编程性。做为一种声明式语言，SQL有很多优点：语法简洁、学习成本低、易于解释器优化等等，但同时也使得它有不易其它语言集成、管理成本高等问题。想想那些SQL注入漏洞，都是血的教训啊。而ORM的出现，正是为了解决SQL语言难于集成的问题，虽然它在一种程度上带来了执行效率的下降，但对开发效率的提升、工程管理成本的下降的贡献，足于弥补它的不足了。

------------------
&copy; 本文版权所有，转载引用请注明出处