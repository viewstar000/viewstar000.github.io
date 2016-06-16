---
layout: post
title: 几种实现表达式计算的方法
author: lili01
categories: ['c++']
tags: ['c++', 'expression evaluation', 'jit']
published: True
description: 在PYTHON、PHP这样的动态语言中，实现表达式计算是非常容易的事情，但是在C++这样的静态编译语言中，实现用户输入的的表达式计算就不那么方便了。
---

## 什么是表达式计算

设想一个报表系统，系统的从很多数据源读取到原始数据，然后需要跟据报表的需要，对数据进行二次加工处理，比如，可以需要把来自DB中的订单数据与来自日志的显现数据，以商品的维度求和后再相除，求得每个商品的转化率。做为一个通用的报表系统，显示不希望将这样一段与业务相关的统计逻辑直接硬编码的系统中。理想的情况，显然是应该在报表的配置信息来描述，比如前面的需求或许可以描述为：

{% highlight sql %}
SELECT count(orders) / count(pv) * 100
FROM orders, pv_logs 
GROUP BY product
{% endhighlight %}

其中`count(orders) / count(pv) * 100`就是一个需要动态计算的表达式。


## 实现表式计算一般步骤

在PYTHON、PHP这样的动态语言中，实现表达式计算是非常容易的事情，但考虑到我们的报表系统的数据量可能是千万量级的，同时还要求能够提供在线服务，这已经超过了PYTHON/PHP之类的脚本的语言的处理能力。因此必须要考虑使用C++这样的编译型语言来实现，但是在C++这样的静态编译语言中，实现用户输入的的表达式计算就不那么方便了。

当然了，作为一项比较常见的需求，自然有不少开源的类库可以使用，这个就不在这里详细说明了。但就其实现原理来说，都大同小异。

### 词法解析与语法解析

理想情况下，用户自然是希望系统能够接受一段前那样的类似SQL一样的查询代码，由系统自动完成解析、执行。这就要系统具备词法解析与语法解析能力，将输入的文本格式的代码转换为结构化的语法树。这里主要是用到各种形式语言处理的方法，也有不少现成的工具和类库可以用。通过这个步骤，最终我们会得到类似下图所示的一个树型结构：

![语法树]({{ site.url }}/images/2016-06-08/p1.png)

其实在工程实践中，我们往往会直接跳过这一步，因为在多数情况下，输入的表达式都不会特别复杂，这时我们完全可以接受直接以前缀表达式的形式输入语法树，从而大大简化系统的实现。如上面的语法，可以书为如下的JSON形式：

{% highlight json %}
["OPT", "*", 
    ["OPT", "/",
        ["CALL", "count", ["RECORD", "orders"]],
        ["CALL", "count", ["RECORD", "pv"]]
    ], 
    ["NUMBER", 100]
]
{% endhighlight %}

看到这里，我想信一定会有人惊呼：这不是传说中的LISP吗？

### 语法树计算

#### 解释执行

有了语法树之后，要执行上面的表达式就比较容易了，最简单的方法就是深度优先遍历整棵语法树，根据每个结点的类型，执行相应的代码就可以了，这也就是最基本的解释执行了。说白了就是一堆的`switch ... case ...` + `递归遍历`

#### 虚拟机

如果只表简单的的计算出结果，解释执行完成可以满足需求，但对树的深度优先遍历无论是用递归方式，还是堆栈+循环的方式，因为涉及大量的压栈、出栈操作，效率方面都不理想。如果一个请求中同一个表达式需要执行几百万次（实际项目中这是很常见的），处理时间就会变重不可接受了。

即然效率的瓶颈在于每次执行要都重新遍历整棵语法树，那么能否把它优化掉呢？这就需要引入编译原理中另一个基础概念了——中间代码。可以在得到语法树后，对语法树进行一次性的遍历，生成可以顺序执行的代码序列。之后，再对需要执行表达式，只需要顺序遍历中间代码就可以完成执行了。为了提高执行效率，中间代码往往被设计成二进制形式，可以利用查表法，进一步提高执行效率。所以现在的中间代码也往往被称为中间字节码。

由于不在需要实现相对复树遍历算法，字节码设计也往往接近于汇编语言的设计，解释器的实现也变得更简单和机械，就像一台虚拟的机器一样。所以这种方式的解释器往往也被称为虚拟机。

为了简单启见，以实现简单的四则运算为例，可以定义如下的字节码：

{% highlight c %}
(NOP,)
(ADD, a, b, c)  // a + b -> c
(SUB, a, b, c)  // a + b -> c
(MUL, a, b, c)  // a + b -> c
(DIV, a, b, c)  // a + b -> c
{% endhighlight %}

其中，参数a可能是一个数字，也可能是一个变量ID，b与a类似，c只能是一个变量ID

基于虚拟机方式的解释器看起来可能是这样的：

{% highlight c++ %}
enum {
    OP_CODE_NOP,
    OP_CODE_ADD,
    OP_CODE_SUB,
    OP_CODE_MUL,
    OP_CODE_DIV,
};

class OPParam{  // 字节码的参数
public:
    enum {
        PARAM_FLAG_DATA,    // 参数为立即数
        PARAM_FLAG_BUFFER,  // 参数变量ID
    };
    
    u_int64_t data; // 参数值
    u_int32_t flag; // 参数类形
}

typedef std::vector<OPParam> OPParams;

class OPExpr{   // 字节码形式的表式
public:
    u_int32_t op_code;      // 操作码
    OPParams  op_params;    // 参数列表
}

typedef std::vector<OPExpr> OPExprs;

class OPProgram{
public:

    u_int64_t   buffer[BUFFER_SIZE];    // 变量缓存, 相当于CPU的寄存器
    OPExprs     exprs;                  // 表达式列表

    // ...

    int exec()
    {
        std::for_each(exprs.begin(), exprs.end(), [&](const OPExpr & expr){
            switch (expr.op_code) {
                case OP_CODE_NOP:
                    break;
                case OP_CODE_ADD:
                {
                    int a = this->getParam<int, 0>(expr);   // 获取第一个参数值，自动判断flag参数
                    int b = this->getParam<int, 1>(expr);   // 获取第二个参数值，自动判断flag参数
                    int c = a + b;
                    this->setParam<int, 2>(expr, c);        // 写回结果
                    break;
                }
                case OP_CODE_SUB:
                {
                    int a = this->getParam<int, 0>(expr);
                    int b = this->getParam<int, 1>(expr);
                    int c = a - b;
                    this->setParam<int, 2>(expr, c);
                    break;
                }
                case OP_CODE_MUL:
                {
                    int a = this->getParam<int, 0>(expr);
                    int b = this->getParam<int, 1>(expr);
                    int c = a * b;
                    this->setParam<int, 2>(expr, c);
                    break;
                }
                case OP_CODE_DIV:
                {
                    int a = this->getParam<int, 0>(expr);
                    int b = this->getParam<int, 1>(expr);
                    // TODO assert
                    int c = a / b;
                    this->setParam<int, 2>(expr, c);
                    break;
                }
                default:
                    break;
            }
        });
        return 0;
    }
}

int main(int argc, const char * argv[]) {

    
    auto program = new OPProgram<64>();
    program->exprs.push_back(OPExpr(OP_CODE_NOP));
    program->exprs.push_back(
        OPExpr(OP_CODE_ADD)
            .push_param(OPParam::Data(1))
            .push_param(OPParam::Buffer(0))
            .push_param(OPParam::Buffer(0))
    );
    program->setBuffer<int, 0>(2);
    {
        boost::timer::auto_cpu_timer t;
        for (int64_t i=0;i<100000000;i++){
            program->exec();
        }
    }
}
{% endhighlight %}

做为对比，上面的代码与下面的代码基本上是等效的，只不过前者计算是的一个动态的表达式，后者是一个静态的函数调用

{% highlight c++ %}

int add (int a, int b){
    return a + b;
}

int main(int argc, const char * argv[]) {

    {
        boost::timer::auto_cpu_timer t;
        int a = 1;
        int b = 2;
        for (int64_t i=0;i<100000000;i++){
            b = add(a, b);
        }
    }

    return 0;
}

{% endhighlight %}

人实际运行的结果来看，在DEBUG模式下，基于VM的表达式计算的耗时大概是原生代码的10倍左右，而在RELEASE模式下，由于原生模式的循环会的编译优化干掉，所以它的耗时没有参考意义，但此时，基于VM的表达式计算的耗时可以减少10倍，与DEUBG模式的原生代码性能相当，可见，这种方法的性能已经可以满足已经可以满足多数应用场景了。

但终究还是有10倍的差距，是否还能继续优化呢？答案是肯定的。上面的例子，为了简化中间字节码的设计，参数的类型与操作码是不绑定的，这就导致了每次执行时，都人先判断参数的类型，再取实际的值，从而增加了运行的耗时。如果能去掉这步判断，执行的耗时也必然能进一步降低。但这就意味着要反操作码与参数类型绑定，换句话说，即便同样是整数加法，要提供多操作码，以支持不同的参数组合，事实上，X86的机器指令就是这样设计的。以加法为例，可能会需要：

{% highlight c %}
(ADD_RR, buffer, buffer, buffer)  // a + b -> c
(ADD_RN, buffer, number, buffer)  // a + b -> c
(ADD_NN, number, number, buffer)  // a + b -> c
{% endhighlight %}

等多个操作码，exec函数中也需要对应的添加更多的case代码，使得exec函数可能会变得异常冗长。但另一个方面，每条中间字节码表达式的结构也会变得更加简单，更加接近于一条机器指令，而不再需要上面的复杂的结构做来保存。简单启见，仅以ADD_RN为例：

{% highlight c++ %}

enum {
    OP_CODE_HALT,
    OP_CODE_NOP,
    OP_CODE_ADD_RR,
    OP_CODE_ADD_RN,
    OP_CODE_ADD_NN,
};

template<u_int32_t buffer_length>
class VMProgram{
public:
    const u_int32_t     BUFFER_LEGNTH = buffer_length;
    
    const u_int64_t *   code_buffer;                // 指令缓存，相当于内存
    u_int64_t           code_size;                  
    u_int64_t           data_buffer[buffer_length]; // 数据缓存，相当于寄存器
    
    // ...
    
    int exec()
    {
        bool        is_halt = false;
        u_int32_t   IP      = 0;
        
        while(!is_halt && IP < this->code_size){
            switch (this->code_buffer[IP]) {
                case OP_CODE_NOP:
                    break;
                case OP_CODE_ADD_RN:
                {
                    int a = this->getData<int>(this->code_buffer[IP+1]);    // 从buffer中取第一个参数
                    int b = this->castValue<int>(this->code_buffer[IP+2]);  // 读取第二个参数，相当于汇编中的立即数
                    int c = a + b;
                    this->setData<int>(this->code_buffer[IP+3], c);         // 结果写回到buffer中
                    IP += 3;
                    break;
                }
                case OP_CODE_HALT:
                default:
                    is_halt = true;
            }
            IP ++;
        }
        
        return is_halt;
    }
    
};

int main(int argc, const char * argv[]) {
    u_int64_t code[64] = {
        OP_CODE_NOP,
        OP_CODE_ADD, 0, 1, 0,
        OP_CODE_HALT,
    };
    auto program = new VMProgram<64>(code, sizeof(code));
    program->setData<int>(0, 2);
    {
        boost::timer::auto_cpu_timer t;
        for (int64_t i=0;i<100000000;i++){
            program->exec();
        }
    }
    return 0;
}

{% endhighlight %}

实际测试结果，DEBUG模式下，上面的代码比之前的代码耗减少了60%，RELEASE模式下，则比DEUBG模式下的原生代码还要快上15%左右。之前的代码实际上就相当于一个动态类型的脚本语言，而后面的方式，则实际上相当于一个静态类型的语言。这也恰恰印证了为啥PYTHON会是脚本语言中最慢的，因为它太动态化了，实在太难优化了。

#### JIT

仔细观察使用静态类型的VM的执行过程会发现，他的执行过程已经非常接近原生代码了，只不过是多了很多跳转，但这样的跳转基实对CPU是不友好的，由其是当VM的代码较大，无法全部装入CPU的指令缓存时，无法发挥出CPU的最佳性能。能否再进一步优化呢？当然可以，那就是近年来火的不行的JIT技术了。前面的方法是，将遍历语法树后生成优化后的中间字节码，那么只要再进一步，将中间字节码转换为机器代码，让CPU去直接执行这段动态生成的机器代码，这就是JIT了。由于基于静态类型的中间字节码的结构已非常接近汇编语法了，所以转起来并复杂，可借助asmjit、nanojit、dynasm之类的库，实现起来并复杂。这里就不贴代码了。当然，还可以考虑直接使用llvm这样的重量级的JIT引擎，只不过对于简单的表达试计算来说，只点杀鸡用牛刀的感觉了。

实际的测试的结果，引入JIT后，在DEUBG模式下，要比原生代码还要快25%以上，而RELEASE模式下则要比DEUBG模式的原生代码还要快上60%以上。

## 性能比较

上面的三个实测的具体数据如下：

执行的操作统一为1亿次加法操作

| 执行方式 | DEBUG模式的耗时（秒）| DEBUG模式的耗时（秒）| 对应的原生代码的耗时（DEUBG模式）|
| ------- | ----------------- | ------------------ | ---------------------------- |
| 动态类型虚拟机 |     7.304373    |   0.754826    |   0.701798    |
| 静态类型虚拟机 |     2.86446     |   0.559686    |   0.688184    |
| JIT          |     0.480174    |   0.232895    |   0.667911    |

做为对比，还测试了几种工作中常用的脚本语言及其对应的JIT版本的执行同操作的耗时

| 语言      | 标准版      | JIT版       |
| --------- | ---------- | ---------- |
| PYTHON    | **19.865s** (CPYTHON 2.7)            | **0.252s** (PYPY 5.3)   | 
| LUA       | **14.926s** (LUA 5.2)                | **0.141s** (LUAJIT 2.0) |
| PHP       | **16.366s** (PHP5) **6.274s** (PHP7) |  ----      (HHVM)       |

测试环境：

  * MacBook Pro OS X 10.11.5
  * 2.6 GHz Intel Core i5 
  * 8 GB 1600 MHz DDR3
  * XCODE 7.3.1

由于HHVM没能在环境上安装成功，所以缺少了相关的数据，但在是另外一台LINUX服务器上，HHVM竟然用了45s多的时间，一定是打开的方式不对……

------------------
&copy; 本文版权所有，转载引用请注明出处
