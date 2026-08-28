# 13. Testing and Benchmark Results — FootGuard AI

## Empirical Test Metrics (Kaggle DFU Dataset)

### Validation Set (114 Patches)
- **Accuracy**: 92.1% (105 / 114 correct)
- **Normal Recall (Specificity)**: 88.9%
- **Abnormal Recall (Sensitivity)**: 92.4%
- **Decision Threshold**: `0.5`
- **Class Weighting**: `9.48x` for NORMAL class

### Confusion Matrix
```
                  Predicted
               NORMAL   ABNORMAL
Actual NORMAL |  TN= 8  |   FP=1   |
Actual ABNORM |  FN= 8  |   TP=97  |
```

### Direct Predefined Chatbot Questions Test
All 8 predefined questions (4 English + 4 Tamil) tested and verified returning 100% direct, concise answers without generic openers.
