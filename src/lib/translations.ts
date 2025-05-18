
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
  fileSize: string;
  selectFileSize: string;
  cancel: string; // New
  testFailed: string; // New
  errorOccurred: string; // New
  disclaimerTitle: string; // New
  disclaimerText: string; // New
}

export const translations: Record<Locale, Translations> = {
  en: {
    appName: "KSA Test",
    tagline: "Measure your internet speed. Results are illustrative.",
    startTest: "Start Test",
    testing: "Testing", // Changed from "Testing..." to allow appending " (Cancel)"
    download: "Download",
    upload: "Upload",
    ping: "Ping",
    mbps: "Mbps",
    ms: "ms",
    language: "Language",
    english: "English",
    arabic: "Arabic",
    installApp: "Install KSA Test",
    installInstructionsIOS: "To install, tap the Share button and then 'Add to Home Screen'.",
    installInstructionsAndroid: "To install, tap the menu button and then 'Install app' or 'Add to Home Screen'.",
    installInstructionsOther: "Follow your browser's instructions to add this page to your home screen.",
    close: "Close",
    results: "Results",
    fileSize: "Test File Size",
    selectFileSize: "Select file size",
    cancel: "Cancel",
    testFailed: "Test Failed",
    errorOccurred: "An Error Occurred",
    disclaimerTitle: "Disclaimer",
    disclaimerText: "This speed test provides illustrative measurements using public servers. Results may vary from dedicated speed test services and real-world performance. Upload test sends a limited amount of data for simulation.",
  },
  ar: {
    appName: "كي اس ايه تست",
    tagline: "قم بقياس سرعة الإنترنت لديك. النتائج توضيحية.",
    startTest: "ابدأ الاختبار",
    testing: "جاري الاختبار", // Changed
    download: "التنزيل",
    upload: "الرفع",
    ping: "البينج",
    mbps: "ميجابت/ثانية",
    ms: "مللي ثانية",
    language: "اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    installApp: "تثبيت كي اس ايه تست",
    installInstructionsIOS: "للتثبيت، اضغط على أيقونة المشاركة ثم 'إضافة إلى الشاشة الرئيسية'.",
    installInstructionsAndroid: "للتثبيت، اضغط على زر القائمة ثم 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'.",
    installInstructionsOther: "اتبع تعليمات متصفحك لإضافة هذه الصفحة إلى شاشتك الرئيسية.",
    close: "إغلاق",
    results: "النتائج",
    fileSize: "حجم ملف الاختبار",
    selectFileSize: "اختر حجم الملف",
    cancel: "إلغاء",
    testFailed: "فشل الاختبار",
    errorOccurred: "حدث خطأ",
    disclaimerTitle: "إخلاء مسؤولية",
    disclaimerText: "يوفر اختبار السرعة هذا قياسات توضيحية باستخدام خوادم عامة. قد تختلف النتائج عن خدمات اختبار السرعة المخصصة والأداء الفعلي. اختبار الرفع يرسل كمية محدودة من البيانات للمحاكاة.",
  },
};
