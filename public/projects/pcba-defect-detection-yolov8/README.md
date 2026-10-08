# PCBA 五类缺陷检测：YOLOv8 全流程落地

## 项目一句话

用 600 张 PCBA 缺陷图片完成 XML 到 YOLO 的数据转换、质量审计、YOLOv8n 训练、早停、独立测试集评估、ONNX 导出和 Gradio 网页演示，最终测试集 mAP50 达到 **87.94%**，mAP50-95 达到 **53.13%**，并把模型、指标、报告和可运行代码一起开源归档。

## 为什么重做这个项目

之前的版本选择手写 Darknet53 + YOLOv3，在 320 输入和受限 CPU 算力下，最终 mAP 只有 2% 左右。虽然过程中发现了“图片增广但 XML 标注不同步”这个真实问题，但从项目交付角度看，模型精度过低，难以支撑缺陷检测的实际演示，也不能证明完整工程链路可用。

这次不再把“手写网络”当作主要目标，而是采用预训练 YOLOv8n，把精力放到更关键的四件事上：

1. 数据格式和划分是否可靠；
2. 输入分辨率是否适合小目标；
3. 训练、验证、测试是否存在信息泄漏；
4. 模型训练完成后能否稳定推理、导出并演示。

## 数据集

- 600 张 2448 x 2048 PCBA 图片，600 个 Pascal VOC XML。
- 4552 个目标框，平均每张图 7.59 个缺陷。
- 5 个类别：`open_solder`、`short`、`skewing`、`solder_bridge`、`tombstoning`。
- 保持原始划分：训练集 350 张、验证集 100 张、测试集 150 张。
- XML 与图片一一对应，没有未知类别、越界框或缺失标签。

![PCBA 缺陷标注样例](/public/projects/pcba-defect-detection-yolov8/dataset-overview.jpg)

数据亮度分析显示，全量图片的平均灰度范围为 **98.01 到 123.18**。项目设置的自动光照校正阈值为 60 到 200，因此 600 张图片均未执行额外亮度或 CLAHE 处理，避免为了“看起来做了预处理”而破坏已经清洗的数据。

![类别数量分布](/public/projects/pcba-defect-detection-yolov8/class-distribution.png)
![亮度分布](/public/projects/pcba-defect-detection-yolov8/brightness-hist.png)

## 模型与训练

使用 `yolov8n.pt` 预训练权重，在 Windows 的 11th Gen Intel Core i5 核显笔记本上以纯 CPU 训练。

| 参数 | 设置 |
| --- | --- |
| 模型 | YOLOv8n |
| 输入尺寸 | 960 x 960 |
| batch | 2 |
| 计划轮数 / patience | 40 / 10 |
| 实际训练 | 第 36 轮早停，最佳权重来自第 26 轮 |
| 优化器 | AdamW，auto 模式选择 |
| 学习率策略 | 余弦退火 |
| 数据增广 | HSV、水平翻转、旋转、平移、缩放、Mosaic |
| close_mosaic | 10 |
| 总耗时 | 约 2.96 小时 |

![训练与验证曲线](/public/projects/pcba-defect-detection-yolov8/training-curve.png)

增广只发生在训练阶段。验证集和测试集不做在线增广，也不复制样本扩充，避免通过重复或变换把训练信息泄漏到评估集。

## 测试集结果

最终评估使用训练过程中完全未参与参数更新的 150 张测试图像。

| 指标 | 结果 |
| --- | ---: |
| Precision | 94.18% |
| Recall | 77.42% |
| mAP50 | 87.94% |
| mAP50-95 | 53.13% |

逐类别结果：

| 类别 | Precision | Recall | mAP50 | mAP50-95 |
| --- | ---: | ---: | ---: | ---: |
| open_solder | 74.15% | 54.59% | 82.07% | 52.89% |
| short | 99.64% | 100.00% | 99.50% | 57.27% |
| skewing | 99.55% | 73.91% | 80.54% | 58.01% |
| solder_bridge | 100.00% | 82.73% | 99.03% | 48.75% |
| tombstoning | 97.57% | 75.86% | 78.57% | 48.75% |

![测试集混淆矩阵](/public/projects/pcba-defect-detection-yolov8/confusion-matrix.png)
![测试样图检测结果](/public/projects/pcba-defect-detection-yolov8/prediction-351.png)

## 工程问题与处理

### 1. 验证集和测试集存在批次差异

最佳验证 mAP50-95 为 36.98%，但测试集提升到 53.13%。这说明固定编号划分可能带有采集批次或分布差异，不能把验证指标直接等同于最终泛化能力。正式项目应使用按批次分层划分或多折交叉验证。

### 2. open_solder 召回率偏低

`open_solder` 的 mAP50 达到 82.07%，但 Recall 只有 54.59%，说明漏检仍是最主要问题。后续应该优先增加该类样本，并针对开焊缺陷单独做阈值和召回率优化，而不是只看总体 mAP。

### 3. Gradio 输入通道不一致导致漏检

Web 端的 `gr.Image(type="numpy")` 返回 RGB，而 Ultralytics 的 ndarray 推理路径默认按 BGR 解释。最初网页对同一张测试图只检出 4 个目标，修正 RGB 到 BGR 转换后恢复为 7 个，与命令行结果一致。这个 bug 不会报错，但会静默降低置信度，属于典型的部署链路问题。

## 系统能力

项目提供统一的 `pcba` 命令行入口：

```bash
pcba prepare     # XML 转 YOLO 并校验数据
pcba analyze     # 数据统计和可视化
pcba train       # YOLOv8n 训练
pcba eval        # 指定划分评估
pcba predict     # 图片、目录、视频、摄像头推理
pcba export      # 导出并验证 ONNX
pcba app         # 启动 Gradio 网页
```

网页支持图片上传、摄像头、视频、置信度/IoU/输入尺寸调整、检测明细和 CSV 下载，并按照“检测到任一缺陷即不合格”的规则输出业务结论。

![Gradio 网页检测界面](/public/projects/pcba-defect-detection-yolov8/web-demo.png)

## 复现与产物

代码和发布产物：<https://github.com/MimiQuark/yolov8-pcba-defect-detection>

仓库中包含：

- 完整 Python 源码、配置、测试和 GitHub Actions；
- `best.pt` PyTorch 权重；
- 固定 960 输入的 ONNX 模型；
- 测试集原始指标、逐类别指标和训练日志；
- Word、PDF 实验报告；
- 数据分析和检测示例图。

原始 700 MB 数据集、训练缓存和中间输出不进入 Git 历史，避免把仓库变成失控的数据仓库。

## 复盘

这次真正有价值的不是“换了一个更新版本的 YOLO”，而是建立了可复现的完整链路：先验证数据和划分，再用预训练模型建立强基线，训练结束后只在独立测试集做最终评估，最后把模型导出、部署、测通并留下完整记录。

如果继续优化，下一步优先级应该是：

1. 重新设计按批次分层的训练/验证/测试划分；
2. 针对 `open_solder` 补样本并做召回率专项评估；
3. 在 GPU 上比较 960 与 1280 输入，并尝试 YOLOv8s；
4. 将模型接入真实相机和分拣控制，补齐延迟与吞吐测试。
