export const translations = {
  en: {
    // Navigation
    nav: {
      dashboard: "Dashboard",
      myGoals: "My Goals", 
      progress: "Progress",
      analytics: "Analytics",
      settings: "Settings",
      language: "Language",
      theme: "Theme",
      logout: "Log out"
    },
    // Dashboard
    dashboard: {
      title: "Transform Your Goals into Actionable Plans",
      subtitle: "Use the SMART(ER) framework to create meaningful goals and let AI break them down into daily tasks.",
      createGoal: "Create New Goal",
      activeGoals: "Active Goals",
      tasksCompleted: "Tasks Completed",
      successRate: "Success Rate",
      quickActions: "Quick Actions",
      recentGoals: "Recent Goals",
      recentActivity: "Recent Activity",
      welcomeMessage: "Welcome to SMART Goals! Create your first goal to see activity here.",
      justNow: "Just now"
    },
    // Goal Creation
    goalWizard: {
      title: "Create Your SMART(ER) Goal",
      setupStep: "SMART(ER) Setup",
      aiStep: "AI Breakdown", 
      saveStep: "Review & Save",
      setupStepMobile: "Setup",
      aiStepMobile: "AI",
      saveStepMobile: "Save",
      category: "Goal Category",
      categoryDescription: "Choose the area of your life this goal focuses on.",
      categories: {
        health: "Health",
        work: "Work", 
        family: "Family",
        personal: "Personal"
      },
      specific: "Specific",
      measurable: "Measurable",
      achievable: "Achievable", 
      relevant: "Relevant",
      timebound: "Time-bound",
      exciting: "Exciting",
      deadline: "Deadline",
      saveDraft: "Save as Draft",
      generateBreakdown: "Generate AI Breakdown",
      generateBreakdownMobile: "Generate Breakdown",
      generating: "Generating..."
    },
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      close: "Close"
    }
  },
  zh: {
    // Navigation  
    nav: {
      dashboard: "仪表板",
      myGoals: "我的目标",
      progress: "进度",
      analytics: "分析",
      settings: "设置", 
      language: "语言",
      theme: "主题",
      logout: "登出"
    },
    // Dashboard
    dashboard: {
      title: "将您的目标转化为可执行的计划",
      subtitle: "使用SMART(ER)框架创建有意义的目标，让AI将其分解为日常任务。",
      createGoal: "创建新目标",
      activeGoals: "活跃目标",
      tasksCompleted: "已完成任务",
      successRate: "成功率",
      quickActions: "快速操作",
      recentGoals: "最近目标",
      recentActivity: "最近活动",
      welcomeMessage: "欢迎使用SMART目标！创建您的第一个目标来查看活动。",
      justNow: "刚刚"
    },
    // Goal Creation
    goalWizard: {
      title: "创建您的SMART(ER)目标",
      setupStep: "SMART(ER)设置",
      aiStep: "AI分解",
      saveStep: "审查和保存", 
      setupStepMobile: "设置",
      aiStepMobile: "AI",
      saveStepMobile: "保存",
      category: "目标类别",
      categoryDescription: "选择这个目标关注的生活领域。",
      categories: {
        health: "健康",
        work: "工作",
        family: "家庭", 
        personal: "个人"
      },
      specific: "具体的",
      measurable: "可衡量的",
      achievable: "可实现的",
      relevant: "相关的", 
      timebound: "有时限的",
      exciting: "令人兴奋的",
      deadline: "截止日期",
      saveDraft: "保存草稿",
      generateBreakdown: "生成AI分解",
      generateBreakdownMobile: "生成分解",
      generating: "生成中..."
    },
    // Common
    common: {
      loading: "加载中...",
      error: "错误",
      retry: "重试", 
      cancel: "取消",
      save: "保存",
      delete: "删除",
      edit: "编辑",
      close: "关闭"
    }
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'zh' as Language, name: 'Chinese Simplified', nativeName: '简体中文' }
];