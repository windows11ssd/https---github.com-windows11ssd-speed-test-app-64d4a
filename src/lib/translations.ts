export type Locale = 'en' | 'ar';

export interface Translations {
  appName: string;
  tagline: string;
  startTest: string;
  testing: string;
  download: string;
  upload: string;
  ping: string;
  mbps: string;
  ms: string;
  language: string;
  english: string;
  arabic: string;
  installApp: string;
  installInstructionsIOS: string;
  installInstructionsAndroid: string;
  installInstructionsOther: string;
  close: string;
  results: string;
}

export const translations: Record<Locale, Translations> = {
  en: {
    appName: "NetGauge",
    tagline: "Measure your internet speed accurately.",
    startTest: "Start Test",
    testing: "Testing...",
    download: "Download",
    upload: "Upload",
    ping: "Ping",
    mbps: "Mbps",
    ms: "ms",
    language: "Language",
    english: "English",
    arabic: "Arabic",
    installApp: "Install NetGauge",
    installInstructionsIOS: "To install, tap the Share button and then 'Add to Home Screen'.",
    installInstructionsAndroid: "To install, tap the menu button and then 'Install app' or 'Add to Home Screen'.",
    installInstructionsOther: "Follow your browser's instructions to add this page to your home screen.",
    close: "Close",
    results: "Results"
  },
  ar: {
    appName: "نت جيج",
    tagline: "قم بقياس سرعة الإنترنت لديك بدقة.",
    startTest: "ابدأ الاختبار",
    testing: "جاري الاختبار...",
    download: "التنزيل",
    upload: "الرفع",
    ping: "البينج",
    mbps: "ميجابت/ثانية",
    ms: "مللي ثانية",
    language: "اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    installApp: "تثبيت نت جيج",
    installInstructionsIOS: "للتثبيت، اضغط على أيقونة المشاركة ثم 'إضافة إلى الشاشة الرئيسية'.",
    installInstructionsAndroid: "للتثبيت، اضغط على زر القائمة ثم 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'.",
    installInstructionsOther: "اتبع تعليمات متصفحك لإضافة هذه الصفحة إلى شاشتك الرئيسية.",
    close: "إغلاق",
    results: "النتائج"
  },
};
