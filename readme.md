# Visual Suffix AutoMaton
![VSAM-logo.png](https://i.loli.net/2018/02/18/5a89705e5efa2.png)
## 简介

顾名思义，这是一个后缀自动机的可视化实现。这里有一个[在线地址](http://liziyang.space/VSAM/)（大力感谢栗主席⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄）

###背景

至少掌握一种自动机的算法（比如AC自动机）

## SAM

> 一个串 S 的后缀自动机（SAM）是一个有限状态自动机（DFA），它能且只能接受所有S的后缀，并且拥有最少的状态和转移。[1]

###一些定义

定义：串 str 在串 S 中匹配的位置的右端点的坐标集合为串 str 的 **right 集**。如串 AQ 在串 QAQSQAQT 的 **right 集**为 {3, 7}（下标从 0 开始）

作为一个确定有限自动机，SAM将拥有相同 **right 集**的串视为相同的状态（如在串 TQAQSQAQ 中，串 AQ 和 串 QAQ 拥有相同的 **right 集**）。不妨设 串 str 对应的 **right 集**为 right_str。 

对于 SAM 的任意两个不相同字串 A 和 B，考虑 right_A 和 right_B 的关系。

1. 如果right_A 和 right_B 相等，不妨设 A 的长度小于 B 的长度，则可以得知 A 是 B 的一个后缀。
2. 如果 right_A 和 right_B 不相等但是有交集，不妨假设 A 的长度小于 B 的长度，则可以得知 A 是 B 的后缀，且 right_B  是 right_A 的子集。

感性的认识一下，固定字串右端点在串 S 的任意位置 R ，让左端点从 S  的起点一直移动到右端点的位置。随着字串的长度逐渐变短，该字串的**right 集**的大小是单调不降的，而且每一次大小增加之前的**right 集**都是增加前的子集。

可以认为**right 集**构成了一个树。

（此处仅为简单说明，严谨证明见 [1]）

##VSAM
![VSAM.png](https://i.loli.net/2018/02/18/5a8970949dc52.png)
### 图例
![hint.png](https://i.loli.net/2018/02/18/5a897373b8d08.png)
SAM对应的模式串会直接显示在背景上
![node.png](https://i.loli.net/2018/02/18/5a8970b3c54aa.png)
在 VSAM 中，状态被表示为一个梯形
![next.png](https://i.loli.net/2018/02/18/5a897373c92f6.png)
鼠标移动到对应字符串时，对应的字符串被激活并且显示能转移到的下一个节点

## 操作

### Append

在 append 输入框输入对应的字符，点击确认按钮/回车，进行 append 操作。

在模式串的提示文本下会显示当前 append 的状态

![append.png](https://i.loli.net/2018/02/18/5a8970b3b4312.png)

### Match

在 match 输入框输入对应的字符，点击确认按钮/回车，进行 match 操作。

在模式串的提示文本下会显示当前 match  的状态

![match.png](https://i.loli.net/2018/02/18/5a8970b3c830b.png)
### Control

1. 在有 Append/Match 操作时，可以使用 next/forward 按钮控制进度
2. restart 按钮可以清空模式串
3. sort 按钮可以对当前显示的状态节点排序
4. 状态节点可以拖动，拖动背景等价于平移所有状态节点

## 参考文献

[1] 张天杨：《后缀自动机及应用》 （2015年信息学奥利匹克中国国家队候选队员论文集）