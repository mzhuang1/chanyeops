import { storage } from "./storage";

export async function seedPlanningData() {
  try {
    // Create planning module templates based on the Jingdezhen case study
    const moduleTemplates = [
      {
        name: "景德镇\"十四五\"规划执行情况分析模板",
        module: "五年规划",
        templateCode: "002",
        content: `分析步骤：
1. 综合实力稳步提升 - 分析GDP、财政收入、省内排名等经济指标
2. 国家试验区建设有力推进 - 评估试验区建设进展和成果
3. 现代化产业体系加快成型 - 分析"1+2+N"产业体系发展
4. 创新驱动作用明显增强 - 评估科技创新投入和成果
5. 城乡发展格局更趋协调 - 分析城镇化进程和空间布局
6. 改革开放步伐迈深迈实 - 评估营商环境和对外开放
7. 生态文明建设持续深化 - 分析环境保护成效
8. 人民生活水平持续增进 - 评估民生改善情况`,
        instructions: "根据本地资料库中的统计数据和部门报告，按照以上8个维度进行系统分析",
        structure: {
          sections: [
            "综合实力稳步提升",
            "国家试验区建设有力推进", 
            "现代化产业体系加快成型",
            "创新驱动作用明显增强",
            "城乡发展格局更趋协调",
            "改革开放步伐迈深迈实",
            "生态文明建设持续深化",
            "人民生活水平持续增进"
          ]
        }
      },
      {
        name: "产业经济结构优化模板",
        module: "产业测评",
        templateCode: "004",
        content: `产业结构分析框架：
1. 产业规模分析 - 各产业产值、增长率、占比
2. 产业链完整度 - 上中下游配套情况
3. 创新能力评估 - 研发投入、专利数量、技术水平
4. 市场竞争力 - 市场份额、品牌影响力
5. 发展潜力评估 - 政策支持、市场前景、要素配置`,
        instructions: "结合产业数据和市场分析，评估产业发展现状和优化方向",
        structure: {
          framework: ["产业规模", "产业链", "创新能力", "竞争力", "发展潜力"]
        }
      }
    ];

    for (const template of moduleTemplates) {
      await storage.createPlanningModuleTemplate(template);
    }

    // Create local resources based on the document structure
    const localResources = [
      {
        name: "景德镇市2024工业概况",
        category: "五年规划数据库",
        subcategory: "总体经济情况",
        department: "市工信局",
        filePath: "/data/industrial_overview_2024.pdf",
        fileName: "工业概况2024.pdf",
        fileType: "pdf",
        description: "2024年景德镇市工业发展情况统计报告，包含规上工业产值、增长率等关键指标",
        tags: ["工业", "统计", "2024", "产值"],
        keywords: ["规上工业", "产值", "增长率", "陶瓷产业", "航空产业"],
        extractedContent: "2024年全市规上工业总产值1214.76亿元，先进陶瓷产业实现产值939亿元，航空产业实现营收312亿元..."
      },
      {
        name: "统计公报",
        category: "五年规划数据库", 
        subcategory: "总体经济情况",
        department: "市统计局",
        filePath: "/data/statistical_bulletin_2024.pdf",
        fileName: "统计公报2024.pdf",
        fileType: "pdf",
        description: "景德镇市2024年国民经济和社会发展统计公报",
        tags: ["统计", "GDP", "经济", "社会发展"],
        keywords: ["GDP", "财政收入", "人口", "城镇化率"],
        extractedContent: "2024年全市地区生产总值1179.30亿元，财政收入情况，人口统计数据..."
      },
      {
        name: "国家试验区建设进展报告",
        category: "五年规划数据库",
        subcategory: "核心工作情况（国家试验区建设）",
        department: "试验区办",
        filePath: "/data/pilot_zone_progress.docx",
        fileName: "试验区建设报告.docx",
        fileType: "docx",
        description: "景德镇国家陶瓷文化传承创新试验区建设进展情况",
        tags: ["试验区", "陶瓷文化", "传承创新"],
        keywords: ["试验区", "陶瓷文化", "非遗保护", "产业发展"],
        extractedContent: "陶瓷文化保护传承创新建设有力，颁布实施《景德镇市瓷业文化遗产保护条例》..."
      }
    ];

    for (const resource of localResources) {
      await storage.createLocalResource(resource);
    }

    console.log("Five-year planning data seeded successfully");
  } catch (error) {
    console.error("Error seeding planning data:", error);
  }
}