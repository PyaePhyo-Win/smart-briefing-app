import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

export const LANGUAGE_STORAGE_KEY = "smart-briefing-language";
export const supportedLanguages = ["en", "my"] as const;

const resources = {
  en: {
    translation: {
      app: {
        title: "Smart Briefing",
        subtitle: "Research Chat",
        badge: "AI Research Briefing",
        heroTitle: "Research with agents or chat directly.",
        heroDescription:
          "Start an agent research briefing, or switch to Chat anytime to ask the LLM directly. Research reports can still enrich later chat context.",
      },
      header: {
        openWorkspace: "Open agent workspace",
        expandWorkspace: "Expand agent workspace",
        collapseWorkspace: "Collapse agent workspace",
        openWorkspaceShort: "Open Workspace",
        hideWorkspaceShort: "Hide Workspace",
        resizeWorkspace: "Resize agent workspace",
        closeWorkspaceOverlay: "Close agent workspace overlay",
        workspaceTitle: "Agent Workspace",
        closeWorkspace: "Close agent workspace",
        signOut: "Sign out",
      },
      auth: {
        title: "Sign in to your workspace",
        body: "Your conversations and report context now live in the backend account session instead of local storage.",
        loginTitle: "Welcome back",
        loginBody: "Sign in to continue your research chats, saved briefings, and report context from any device.",
        registerTitle: "Create your workspace",
        registerBody: "Set up a secure account to save conversations, AI research reports, and later chat context.",
        email: "Email",
        password: "Password",
        passwordPlaceholder: "At least 8 characters",
        passwordHint: "Use 8 or more characters for your password.",
        login: "Sign in",
        register: "Create account",
        loading: "Loading your workspace...",
        submitting: "Please wait...",
        switchToLogin: "Already have an account? Sign in",
        switchToRegister: "Need an account? Create one",
        featureResearch: "Agent research briefings",
        featureChat: "Context-aware chat",
        featureSecure: "Protected account sessions",
      },
      language: {
        label: "Language",
        english: "English",
        myanmar: "Burmese",
      },
      theme: {
        light: "Light",
        dark: "Dark",
        switchMode: "Switch to {{mode}} mode",
      },
      status: {
        connecting: "Connecting to engine...",
        researching: "Agent research in progress",
        polishing: "Generating final report",
        done: "Report Complete",
        error: "Error",
      },
      composer: {
        research: "Research",
        chat: "Chat",
        researching: "Researching",
        chatting: "Chatting",
        researchPlaceholder: "Ask the agents to research a topic...",
        chatPlaceholder: "Ask the LLM directly or continue this conversation...",
        cancel: "Cancel",
        charactersRemaining: "{{count}} characters remaining",
        chatRequiresResearch: "Chat is available anytime. Research can add report context when needed.",
      },
      conversation: {
        emptyTitle: "Start a conversation",
        emptyBody:
          "Choose Research to start a fresh agent briefing, or Chat to ask the LLM a direct question. After research, Chat can use the latest report as context.",
        you: "You",
        researchReport: "Research Report",
        assistant: "Assistant",
        copy: "Copy",
        copied: "Copied",
        generatingResponse: "Generating response",
      },
      history: {
        eyebrow: "History",
        title: "Conversation history",
        newChat: "New chat",
        emptyTitle: "No saved conversations",
        emptyBody: "Conversations appear here after you send a real message.",
        createdAt: "Created {{value}}",
        openHistory: "Open conversation history",
        closeHistory: "Close conversation history",
        conversationFallbackTitle: "Untitled conversation",
      },
      workspace: {
        title: "Agent Workspace",
        live: "Live",
        empty: "Submit a topic to begin...",
        waiting: "Waiting for agent events...",
      },
      settings: {
        title: "Settings",
        backToWorkspace: "Back to workspace",
        accountBadge: "Protected account",
        accountTitle: "Account settings",
        accountDescription:
          "Manage your signed-in workspace identity. More preferences can be added here as the product grows.",
        loading: "Loading account settings...",
        email: "Email",
        userId: "User ID",
        unavailable: "Unavailable",
      },
      researchForm: {
        topic: "Research topic",
        placeholder: "Ask for a briefing...",
        connecting: "Connecting...",
        researching: "Researching...",
        polishing: "Polishing...",
        submit: "Research",
        cancel: "Cancel",
        charactersRemaining: "{{count}} characters remaining",
      },
      report: {
        assistant: "Assistant",
        title: "Research briefing",
        copy: "Copy",
        copied: "Copied",
        emptyTitle: "Start a conversation",
        emptyBody:
          "Submit a research topic below and the assistant will stream the briefing here as it works.",
        generating: "Generating report",
      },
      errors: {
        serverError: "Server error: {{status}}",
        backendUnreachable: "Failed to reach backend server.",
        emptyStream: "Streaming response is empty.",
        chatRequiresConversation: "Unable to start or continue this chat. Please try again.",
      },
    },
  },
  my: {
    translation: {
      app: {
        title: "Smart Briefing",
        subtitle: "သုတေသန စကားဝိုင်း",
        badge: "AI သုတေသန အကျဉ်းချုပ်",
        heroTitle: "Agent များနဲ့ သုတေသနလုပ်နိုင်သလို Chat ကိုလည်း တိုက်ရိုက်သုံးနိုင်ပါတယ်။",
        heroDescription:
          "Agent သုတေသန briefing တစ်ခုစတင်နိုင်ပါသည်၊ သို့မဟုတ် Chat သို့အချိန်မရွေးပြောင်းပြီး LLM ကိုတိုက်ရိုက်မေးနိုင်ပါသည်။ Research report များသည် နောက်ပိုင်း chat context ကို ပိုမိုကောင်းမွန်စေနိုင်ပါသည်။",
      },
      header: {
        openWorkspace: "Agent workspace ကိုဖွင့်ရန်",
        expandWorkspace: "Agent workspace ကိုချဲ့ရန်",
        collapseWorkspace: "Agent workspace ကိုခေါက်ရန်",
        openWorkspaceShort: "Workspace ဖွင့်ရန်",
        hideWorkspaceShort: "Workspace ဖျောက်ရန်",
        resizeWorkspace: "Agent workspace အရွယ်အစားပြောင်းရန်",
        closeWorkspaceOverlay: "Agent workspace overlay ကိုပိတ်ရန်",
        workspaceTitle: "Agent Workspace",
        closeWorkspace: "Agent workspace ကိုပိတ်ရန်",
        signOut: "ထွက်ရန်",
      },
      auth: {
        title: "သင်၏ workspace သို့ ဝင်ရောက်ပါ",
        body: "Conversation များနှင့် report context များကို local storage မဟုတ်ဘဲ backend account session တွင် သိမ်းဆည်းထားပါသည်။",
        loginTitle: "ပြန်လည်ဝင်ရောက်ရန်",
        loginBody: "သင်၏ research chat များ၊ သိမ်းထားသော briefing များနှင့် report context များကို မည်သည့် device မှမဆို ဆက်လက်အသုံးပြုရန် ဝင်ရောက်ပါ။",
        registerTitle: "သင်၏ workspace ကို ဖန်တီးပါ",
        registerBody: "Conversation များ၊ AI research report များနှင့် နောက်ပိုင်း chat context များကို သိမ်းဆည်းရန် လုံခြုံသော account တစ်ခု ဖန်တီးပါ။",
        email: "Email",
        password: "Password",
        passwordPlaceholder: "အနည်းဆုံး စာလုံး ၈ လုံး",
        passwordHint: "Password အတွက် စာလုံး ၈ လုံး သို့မဟုတ် ထို့ထက်ပိုသုံးပါ။",
        login: "ဝင်ရန်",
        register: "အကောင့်ဖွင့်ရန်",
        loading: "သင်၏ workspace ကို ဖွင့်နေသည်...",
        submitting: "ခဏစောင့်ပါ...",
        switchToLogin: "အကောင့်ရှိပြီးသားလား? ဝင်ရန်",
        switchToRegister: "အကောင့်အသစ်လိုပါသလား? ဖွင့်ရန်",
        featureResearch: "Agent research briefing များ",
        featureChat: "Context ပါသော chat",
        featureSecure: "လုံခြုံသော account session များ",
      },
      language: {
        label: "ဘာသာစကား",
        english: "English",
        myanmar: "မြန်မာ",
      },
      theme: {
        light: "အလင်း",
        dark: "အမှောင်",
        switchMode: "{{mode}} mode သို့ပြောင်းရန်",
      },
      status: {
        connecting: "Engine သို့ ချိတ်ဆက်နေသည်...",
        researching: "Agent များ သုတေသနလုပ်နေသည်",
        polishing: "နောက်ဆုံး အစီရင်ခံစာ ပြုစုနေသည်",
        done: "အစီရင်ခံစာ ပြီးစီးပါပြီ",
        error: "အမှား",
      },
      composer: {
        research: "သုတေသန",
        chat: "Chat",
        researching: "သုတေသနလုပ်နေသည်",
        chatting: "စကားပြောနေသည်",
        researchPlaceholder: "Agent များကို သုတေသနလုပ်စေလိုသော အကြောင်းအရာကို ရေးပါ...",
        chatPlaceholder: "LLM ကို တိုက်ရိုက်မေးရန် သို့မဟုတ် စကားဝိုင်းကို ဆက်လက်ပြုလုပ်ရန် ရေးပါ...",
        cancel: "ရပ်ရန်",
        charactersRemaining: "စာလုံး {{count}} လုံး ကျန်သေးသည်",
        chatRequiresResearch: "Chat ကို အချိန်မရွေးသုံးနိုင်ပါသည်။ လိုအပ်ပါက Research က report context ထည့်ပေးနိုင်ပါသည်။",
      },
      conversation: {
        emptyTitle: "စကားဝိုင်း စတင်ပါ",
        emptyBody:
          "Agent briefing အသစ်စတင်ရန် Research ကိုရွေးပါ၊ သို့မဟုတ် LLM ကိုတိုက်ရိုက်မေးရန် Chat ကိုရွေးပါ။ သုတေသနပြီးနောက် Chat သည် နောက်ဆုံး report ကို context အဖြစ်အသုံးပြုနိုင်သည်။",
        you: "သင်",
        researchReport: "သုတေသန အစီရင်ခံစာ",
        assistant: "Assistant",
        copy: "ကူးယူရန်",
        copied: "ကူးယူပြီး",
        generatingResponse: "အဖြေ ထုတ်ပေးနေသည်",
      },
      history: {
        eyebrow: "မှတ်တမ်း",
        title: "စကားဝိုင်း မှတ်တမ်း",
        newChat: "Chat အသစ်",
        emptyTitle: "သိမ်းထားသော စကားဝိုင်း မရှိသေးပါ",
        emptyBody: "တကယ့်စာတစ်စောင် ပို့ပြီးနောက် စကားဝိုင်းများကို ဤနေရာတွင် ပြပါမည်။",
        createdAt: "ဖန်တီးချိန် {{value}}",
        openHistory: "စကားဝိုင်း မှတ်တမ်းကို ဖွင့်ရန်",
        closeHistory: "စကားဝိုင်း မှတ်တမ်းကို ပိတ်ရန်",
        conversationFallbackTitle: "ခေါင်းစဉ်မရှိသော စကားဝိုင်း",
      },
      workspace: {
        title: "Agent Workspace",
        live: "Live",
        empty: "စတင်ရန် အကြောင်းအရာတစ်ခု ပေးပို့ပါ...",
        waiting: "Agent event များကို စောင့်နေသည်...",
      },
      settings: {
        title: "ဆက်တင်များ",
        backToWorkspace: "Workspace သို့ ပြန်သွားရန်",
        accountBadge: "လုံခြုံသော အကောင့်",
        accountTitle: "အကောင့် ဆက်တင်များ",
        accountDescription:
          "ဝင်ရောက်ထားသော workspace identity ကို စီမံပါ။ Product တိုးတက်လာသည်နှင့်အမျှ preference များကို ဤနေရာတွင် ထပ်ထည့်နိုင်ပါသည်။",
        loading: "အကောင့် ဆက်တင်များကို ဖွင့်နေသည်...",
        email: "Email",
        userId: "User ID",
        unavailable: "မရရှိနိုင်ပါ",
      },
      researchForm: {
        topic: "သုတေသန အကြောင်းအရာ",
        placeholder: "အကျဉ်းချုပ်တစ်ခု တောင်းဆိုပါ...",
        connecting: "ချိတ်ဆက်နေသည်...",
        researching: "သုတေသနလုပ်နေသည်...",
        polishing: "ပြင်ဆင်နေသည်...",
        submit: "သုတေသန",
        cancel: "ရပ်ရန်",
        charactersRemaining: "စာလုံး {{count}} လုံး ကျန်သေးသည်",
      },
      report: {
        assistant: "Assistant",
        title: "သုတေသန အကျဉ်းချုပ်",
        copy: "ကူးယူရန်",
        copied: "ကူးယူပြီး",
        emptyTitle: "စကားဝိုင်း စတင်ပါ",
        emptyBody:
          "အောက်တွင် သုတေသနအကြောင်းအရာကို ပေးပို့ပါ။ Assistant က အလုပ်လုပ်နေစဉ် briefing ကို ဒီနေရာတွင် တိုက်ရိုက်ထုတ်ပြပါမည်။",
        generating: "အစီရင်ခံစာ ထုတ်လုပ်နေသည်",
      },
      errors: {
        serverError: "Server အမှား: {{status}}",
        backendUnreachable: "Backend server သို့ မရောက်ရှိနိုင်ပါ။",
        emptyStream: "Streaming response မရှိပါ။",
        chatRequiresConversation: "ဤ Chat ကို စတင်ရန် သို့မဟုတ် ဆက်ရန် မအောင်မြင်ပါ။ ပြန်လည်ကြိုးစားပါ။",
      },
    },
  },
} as const;

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      supportedLngs: [...supportedLanguages],
      nonExplicitSupportedLngs: true,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        caches: ["localStorage"],
      },
    });
}

export { i18n };