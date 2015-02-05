---
layout: post
title:  "小试机器学习用于内容质量评估"
date:   2015-02-05 19:48:17
categories: python ml
---


由于项目需要，需要对一批问答类数据做全文检索，由于收集到的数据五花八门，其它很多数据的内容质量很差。比如针对的病症的问答的，标题可能只是“急！！！”，而回答的内容也往往只是简单的一句“建议去医院就诊”。这样的结果被检索出来没有任何意思，所以需要设计一个针对内容质量的评估程序，排除到这样质量差的数据，同时将质量好的数据加权。

这个问题很容易联想到文本分类器，正好最近在学习一些机器学习的基础知识，正好小试一把，分别用朴素贝叶期分类器和神经网络实现了DEMO程序。

## 朴素贝叶斯分类器

具体的原理就不细说了，基本上就是把书上的算法用PYTHON实现出来，代码如下：

{% highlight python %}
class CategoryModel(object):
    
    def __init__(self):
        
        self.P_Cates        = {}
        self.P_CateWords    = {}
        self.total_docs     = 0
        self.total_words    = 0
        
    def append_doc(self, cate, doc):
        
        self.total_docs += 1
        self.P_Cates[cate] = self.P_Cates.get(cate, 0) + 1
        words = jieba.cut(doc)
        for word in words:
            self.append_word(cate, word)
        
    def append_word(self, cate, word):
        
        if cate not in self.P_CateWords:
            self.P_CateWords[cate] = {}
        self.total_words += 1
        self.P_CateWords[cate][word] = self.P_CateWords[cate].get(word, 0) + 1
        
    def get_cates(self, doc):
        
        words   = list(jieba.cut(doc))
        result  = {}
        for cate, p_cate in self.P_Cates.iteritems():
            p_cate  = float(p_cate) / float(self.total_docs)
            p_words = reduce(lambda a, b : a * b, 
                            map(lambda word:   float(self.P_CateWords[cate].get(word, 0) + 1) \
                                             / float(self.total_words + len(self.P_CateWords[cate])),
                                words
                            )
                        )
            result[cate] = p_cate * p_words
        result = result.items()
        result.sort(key = lambda r:r[1], reverse = True)
        return result
{% endhighlight %}

有了分类模型，接下来就是输入训练数据了，为方便对数据进行人工标注，又实现了下面的标注程序：
{% highlight python %}
def practice_manual(model, text_input, skip_count = 0):
    """人工标注
        model       => CategoryModel(),
        text_input  => 文本文件，每行一个问答数据，字段\t分隔，UTF8编码
        skip_count  => 跳过的行数
    """
            
    line_no = 0
    skip_count = skip_count
    for line in open(text_input):
        
        line_no += 1
        if line_no <= skip_count:
            continue
        
        segs = line.split('\t')
        text = segs[0].strip().decode('utf8', 'ignore')
        
        print line_no, text.encode('GBK', 'ignore')
        cates = model.get_cates(text)
        print cates
        while True:
            cate = raw_input(u"Select [G]ood, [N]ormal, [B]ad, or ENTER to accept above:")
            if not cate:
                model.append_doc(cates[0][0], text)
                break
            elif cate.upper() in ("G","N","B"):
                model.append_doc(cate.upper(), text)
                break
            else:
                print "unknown category ,retry ..."
{% endhighlight %}

上面这段代码的好处就是你可以实时的观察到训练出的结果在新数据上的表现。
训练数据举例：

| 待分类数据                | 目标分类  | 说明                      |
| :--------                | :-----:   | :----                     |
| 夏季如何预防肠胃炎？      | G         | 意图清晰，显示效果好      |
| 经常拉肚子怎么办？        | G         | 意图清晰，显示效果好      |
| 肠胃炎治疗                | N         | 意图清晰，显示效果一般    |
| 又拉肚子了                | N         | 意图不清晰，显示效果一般  |
| 肠胃炎                    | B         | 意图不清晰，显示效果差    |
| 怎么办                    | B         | 无意图，显示效果差        |
| 急求！！！！              | B         | 无意图，显示效果差        |
| 在线等                    | B         | 无意图，显示效果差        |

实际实验的结果并不理想，分析原因，可能是由于朴素贝叶斯分类器是基于简单的词频统计的，并且默认词与词之间的统计概率是完全独立的，而在上面的数据举例中可以看到，同样是肠胃炎这个词在，在不同的语境下的分类是不一样的，且其概率分布并没有明显的倾向性。

## 神经网络

分析前面的训练数据，似乎分类条件符合某种bool组合逻辑运算，只是要人工穷举这些组合逻辑有点不太现实。进下观察，这种组合逻辑似乎与词性有关，比如符合模式`疾病名+[预防｜如何｜治疗｜怎么办]`时，被分为`Good`的概率就高。按书本上的介绍，经过训练的神经网络具备自动建立识别模式的能力，所以接下来便试验用神经网络来分类。

### 神比网络的实现

书上的标准算法，PYTHON实现

#### 网络结点定义

除了value，为了便于操作，每个结点还有一个name属性。

{% highlight python %}
class Node(object):
    
    def __init__(self, name = None, value = None):
        
        self.__name   = name
        self.__value  = None
        if not self.__name:
            self.__name = 'Node_' + id(self)
            
    def __repr__(self):
        
        return '<Node %s %s>' % (self.__name, self.__value)
        
    def __hash__(self):
        
        return hash(self.name)
    
    @property
    def name(self):
        
        return self.__name
    
    def get_value(self):
        
        return float(self.__value)
    
    def set_value(self, value):
        
        self.__value = float(value)
        
    value = property(get_value, set_value)
    
{% endhighlight %}

#### 神经元的定义

一个神经元有若干个输入结点，一个输出结点，使用sigmoid函数

{% highlight python %}
class Unit(Node):
    
    weight_eta = 0.05
    
    def __init__(self, name = None, input_weight = None):
        
        super(Unit, self).__init__(name)
        self.input_vector = {}
        self.input_weight = input_weight
        if not self.input_weight:
            self.input_weight = random.random() * 0.1 - 0.05
        self.target_delta = 0.0
        self.weight_delta = 0.0
            
    def __repr__(self):
        
        return '<Unit %s %s %s>' % (self.name, self.output, self.input_vector)
    
    def append_input(self, node, weight = None):
        
        if not weight:
            weight = random.random() * 0.1 - 0.05
        self.input_vector[node] = weight
    
    @property
    def output(self):
        
        return float(self.value)
    
    def trigger(self):
        
        n = sum(map(lambda (x, w): float(x.value) * float(w), self.input_vector.iteritems()))
        n += float(self.input_weight)
        self.value = 1.0 / ( 1.0 + math.exp(0.0 - n) )
        
    def set_target(self, target = None):
        
        self.target_delta = float(target) - self.output
        self.weight_delta = self.output * ( 1.0 - self.output ) * self.target_delta
        #self.spread_delta()
    
    def collect_delta(self, delta):
        
        self.target_delta += float(delta)
        self.weight_delta = self.output * ( 1.0 - self.output ) * self.target_delta
        #self.spread_delta()
        
    def spread_delta(self):
        
        for input_node, weight in self.input_vector.iteritems():
            if isinstance(input_node, Unit):
                input_node.collect_delta(float(weight) * self.weight_delta)
    
    def adjust_weight(self):
        
        self.input_weight += self.weight_eta * self.weight_delta
        for input_node, weight in self.input_vector.iteritems():
            self.input_vector[input_node] = float(weight) \
                                            + self.weight_eta * self.weight_delta * input_node.value
        self.target_delta = 0.0
        self.weight_delta = 0.0
        
{% endhighlight %}

#### 神经网络的定义

支持任意层数和神经元数的网络定义，充许动态添加输入结点

{% highlight python %}
class Net(object):
    
    def __init__(self, levels = []):
        
        self.__levels   = levels
        self.__units    = []
        self.__inputs   = {}
        self.generate_net()
    
    def __repr__(self):
        
        return '<Net %s %s %s>' % (id(self), self.inputs, self.units)
    
    @property
    def inputs(self):
        
        return self.__inputs
    
    @property
    def units(self):
        
        return self.__units
    
    def generate_net(self):
        
        for level in self.__levels:
            units =[]
            for i in xrange(level):
                units.append(Unit('Unit_%s_%s' % (len(self.units), i)))
                if self.units:
                    for pu in self.units[-1]:
                        units[-1].append_input(pu)
            self.units.append(units)
            
    def append_input(self, node, weight = None):
        
        self.inputs[node.name] = node
        for unit in self.units[0]:
            unit.append_input(node, weight)
    
    def get_outputs(self):
        
        return map(lambda n:n.value, self.units[-1])
    
    def trigger(self):
        
        for units in self.units:
            for unit in units:
                unit.trigger()
    
    def adjust_target(self, targets):
        
        for output_unit, target in zip(self.units[-1], targets):
            output_unit.set_target(target)
        for i in xrange(len(self.units), 0, -1):
            units = self.units[i - 1]
            for unit in units:
                unit.spread_delta()
                unit.adjust_weight()
                
    def verbose(self):
        
        levels = 0
        for units in self.units:
            for unit in units:
                print ' ' * levels, unit.name, unit.input_weight, ' '.join(map(str,unit.input_vector.itervalues()))
            levels += 4
{% endhighlight %}
### 使用神经网络进行分类

创建一个二层的神层网络, 输出层有3个神经元，对应`Good, Normal, Bad`，隐藏层有6个神经元（数量根据直觉定的），输入结点为动态添加。
{% highlight python %}
net = Net([6,3])
{% endhighlight %}
对网络进行训练
{% highlight python %}
cate_map = {
    'G' : (1, 0, 0),
    'N' : (0, 1, 0),
    'B' : (0, 0, 1),
}

for line in open(r"c:\tmp\cate_practice.txt"):
            
    line    = line.decode('UTF8', 'ignore')
    segs    = line.split()
    text    = ''.join(segs[:-1])
    target  = cate_map[segs[-1]]
    words   = list(jieba.cut(text))
    
    for node in net.inputs.itervalues():
        node.value = 0.0
        
    for word in words:
        if word not in net.inputs:
            net.append_input(Node(word))
        net.inputs[word].value = 1.0
    net.trigger()
    print line.encode('GBK', 'ignore'), target, net.get_outputs()
    
    for j in xrange(100):
        net.trigger()
        net.adjust_target(target)
    print net.get_outputs()
{% endhighlight %}

最后，两种方法的结果对比（节选）：
{% highlight python %}
985 脂肪合成的部位
[('G', 8.321612156156357e-14), ('B', 5.791442360710643e-14), ('N', 4.6670704698626663e-14)]
[('B', 0.33807795753111997), ('N', 0.3159529794937134), ('G', 0.006909908450610514)]
986 小儿支原体感染
[('N', 3.482301294870387e-11), ('B', 2.203322071452582e-11), ('G', 2.0346341721802294e-11)]
[('B', 0.9499746567586071), ('N', 0.045354183174382785), ('G', 0.0010766675531699238)]
987 头沉晕眩
[('B', 3.7720873863268206e-08), ('G', 2.4320660471461007e-08), ('N', 2.0208955181231144e-08)]
[('B', 0.991954037807905), ('N', 0.015417119173786959), ('G', 0.000444877073043545)]
988 同时服两种药
[('G', 7.565101960142143e-15), ('B', 6.4349359563451565e-15), ('N', 3.3336217641876192e-15)]
[('B', 0.980019070450279), ('N', 0.035591154330113006), ('G', 0.0004824393769211435)]
924 胃病如如何治疗
[('G', 3.404295882063964e-13), ('B', 3.21746797817258e-14), ('N', 2.3335352349313332e-14)]
[('G', 0.535978925416172), ('B', 0.15357478212210712), ('N', 0.00828109379841607)]
925 现症状不知是不是阴道炎
[('G', 1.5505716510609244e-16), ('N', 3.0636386115451983e-17), ('B', 1.127617282069829e-17)]
[('B', 0.19937023600183504), ('N', 0.14380538324595624), ('G', 0.03133245764788805)]
926 脚趾麻木
[('N', 6.062686554369343e-08), ('B', 3.7720873863268206e-08), ('G', 2.4320660471461007e-08)]
[('N', 0.9057952661860795), ('B', 0.898006394383713), ('G', 1.223218695537062e-05)]
928 肾结石
[('G', 0.00017442777690131832), ('B', 0.00012915627210783036), ('N', 7.036758194104684e-05)]
[('B', 0.9915318810162058), ('N', 0.014492858781218447), ('G', 0.0005059980829910691)]
929 清血平糖
[('B', 1.101661035726291e-11), ('G', 6.7821139072674314e-12), ('N', 5.803835491450645e-12)]
[('B', 0.9927666644115796), ('N', 0.01143214005343575), ('G', 0.0005738962663391434)]
930 尿不尽为何病
[('G', 1.1347652940213215e-14), ('B', 3.2174679781725782e-15), ('N', 1.6668108820938096e-15)]
[('B', 0.8695394965227182), ('G', 0.08092796226246078), ('N', 0.0015311144046682515)]
931 妇科霉菌会影响身体健
[('G', 1.6472224269629775e-19), ('B', 3.293274772400201e-21), ('N', 8.248596204260837e-22)]
[('G', 0.8629223958164886), ('B', 0.41616657597924556), ('N', 0.00021147472191265177)]
932 今天下身有异味，想咨询一下是否得了什么妇科病
[('G', 1.436684217822436e-39), ('B', 8.595163994564372e-41), ('N', 2.08412966302405e-42)]
[('G', 0.9983654910545282), ('B', 0.006250578885365429), ('N', 0.00040058711493571323)]
933 报告单咨询
[('B', 2.2632524317960925e-07), ('N', 8.083582072492458e-08), ('G', 2.4320660471461007e-08)]
[('B', 0.9372879242197747), ('N', 0.07544559474132508), ('G', 0.0009308630834118569)]
934 黄斑穿孔
[('B', 3.7720873863268206e-08), ('G', 2.4320660471461007e-08), ('N', 2.0208955181231144e-08)]
[('B', 0.991235934238142), ('N', 0.015380160751184204), ('G', 0.0004979540330717368)]
935 尿常规
[('B', 0.00012915627210783036), ('G', 8.721388845065916e-05), ('N', 7.036758194104684e-05)]
[('B', 0.9918895100959317), ('N', 0.013096182312491553), ('G', 0.000537273744608585)]
936 有病一个月了,还用检查别的吗
[('G', 2.4754526606487635e-27), ('N', 1.4536728497396775e-28), ('B', 4.134825974069696e-29)]
[('N', 0.9815959723466302), ('B', 0.008152641582424944), ('G', 0.0059050746632167556)]
{% endhighlight %}

&copy; 本文版权所有，转载引用请注明出处
