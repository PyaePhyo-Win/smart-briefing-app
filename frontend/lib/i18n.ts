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
        heroTitle: "Research with agents. Then chat with the report.",
        heroDescription:
          "Start a fresh agent research thread, then switch to Chat to ask follow-up questions using the latest report as context.",
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
        chatPlaceholder: "Ask about the report or continue the conversation...",
        cancel: "Cancel",
        charactersRemaining: "{{count}} characters remaining",
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
      },
    },
  },
  my: {
    translation: {
      app: {
        title: "Smart Briefing",
        subtitle: "သုတေသန စကားဝိုင်း",
        badge: "AI သုတေသန အကျဉ်းချုပ်",
        heroTitle: "Agent များနဲ့ သုတေသနလုပ်ပြီး အစီရင်ခံစာကို ဆက်မေးနိုင်ပါတယ်။",
        heroDescription:
          "သုတေသန thread အသစ်တစ်ခု စတင်ပြီးနောက် Chat သို့ပြောင်းကာ နောက်ဆုံး report ကို context အဖြစ်သုံးပြီး ဆက်လက်မေးမြန်းနိုင်ပါတယ်။",
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
        chatPlaceholder: "Report ကိုမေးမြန်းရန် သို့မဟုတ် စကားဝိုင်းကို ဆက်လက်ပြုလုပ်ရန် ရေးပါ...",
        cancel: "ရပ်ရန်",
        charactersRemaining: "စာလုံး {{count}} လုံး ကျန်သေးသည်",
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