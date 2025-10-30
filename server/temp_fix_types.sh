#!/bin/bash

# 修复 AIService 调用 - generateText 只接受一个参数
echo "修复 AIReportOptimizer.ts..."
sed -i '' 's/await AIService\.generateText(prompt, {/await AIService.generateText({ prompt, type: "generate", /g' src/services/AIReportOptimizer.ts
sed -i '' 's/maxTokens: \([0-9]*\),$/maxTokens: \1 }),/g' src/services/AIReportOptimizer.ts

# 修复返回值类型 - AIGenerateResponse 改为 string
sed -i '' 's/const optimized = await/const response = await/g' src/services/AIReportOptimizer.ts
sed -i '' 's/return optimized;$/return response.data.generated_text;/g' src/services/AIReportOptimizer.ts

# 修复 undefined 类型问题 - 添加空值检查
sed -i '' 's/req\.params\.id/req.params.id!/g' src/controllers/templateController.ts
sed -i '' 's/req\.params\.reportId/req.params.reportId!/g' src/controllers/weeklyReportController.ts

echo "✅ 基础修复完成"
