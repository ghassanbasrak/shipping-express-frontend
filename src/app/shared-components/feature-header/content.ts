import i18next from "i18next";

const features = {
  "admins-app": [
    "users",
    "ACCOUNTS",
    "Manage staff access and account permissions.",
    "إدارة حسابات الموظفين وصلاحيات الوصول.",
  ],
  "affiliate-merchants-app": [
    "user-group",
    "ACCOUNTS",
    "Manage affiliates and review their account activity.",
    "إدارة المسوقين ومراجعة نشاط حساباتهم.",
  ],
  "affiliate-withdraw-requests-app": [
    "cash",
    "PAYMENTS",
    "Review affiliate withdrawals and payout details.",
    "مراجعة طلبات سحب أرباح المسوقين وتفاصيل الدفع.",
  ],
  "alerts-app": [
    "speakerphone",
    "MANAGEMENT",
    "Manage announcements and customer notifications.",
    "إدارة الإعلانات والتنبيهات الموجهة للعملاء.",
  ],
  "applications-app": [
    "cube-transparent",
    "MANAGEMENT",
    "Manage application access and integration settings.",
    "إدارة وصول التطبيقات وإعدادات التكامل.",
  ],
  "bank-transfers-app": [
    "library",
    "PAYMENTS",
    "Review bank transfers and their payment status.",
    "مراجعة التحويلات البنكية وحالة الدفع.",
  ],
  "cancel-shipment-requests-app": [
    "x-circle",
    "OPERATIONS",
    "Review shipment cancellation requests and decisions.",
    "مراجعة طلبات إلغاء الشحنات والقرارات المتعلقة بها.",
  ],
  "cities-app": [
    "office-building",
    "LOCATIONS",
    "Manage cities and shipping-company naming mappings.",
    "إدارة المدن ومسمياتها لدى شركات الشحن.",
  ],
  "countries-app": [
    "globe-alt",
    "LOCATIONS",
    "Manage countries and shipping-company naming mappings.",
    "إدارة الدول ومسمياتها لدى شركات الشحن.",
  ],
  "coupons-app": [
    "ticket",
    "MANAGEMENT",
    "Manage discount codes and their availability.",
    "إدارة أكواد الخصم وحالة تفعيلها.",
  ],
  "logs-app": [
    "clipboard-list",
    "MANAGEMENT",
    "Review recorded activity and audit details.",
    "مراجعة النشاط المسجل وتفاصيل سجل العمليات.",
  ],
  "merchant-dues-app": [
    "cash",
    "PAYMENTS",
    "Review merchant COD dues and settlement activity.",
    "مراجعة مستحقات التجار وعمليات التسوية.",
  ],
  "merchant-statistics-app": [
    "chart-bar",
    "REPORTS",
    "Generate merchant financial reports for the selected period.",
    "إعداد التقارير المالية للتاجر ضمن الفترة المحددة.",
  ],
  "merchants-app": [
    "users",
    "ACCOUNTS",
    "Manage merchant accounts and profile details.",
    "إدارة حسابات التجار وبيانات ملفاتهم.",
  ],
  "plans-app": [
    "collection",
    "SETTINGS",
    "Manage payment plans and shipping prices.",
    "إدارة خطط الدفع وأسعار الشحن.",
  ],
  "shipment-users-app": [
    "identification",
    "OPERATIONS",
    "Manage sender and receiver contact details.",
    "إدارة بيانات الاتصال بالمرسلين والمستلمين.",
  ],
  "shipments-app": [
    "truck",
    "OPERATIONS",
    "Manage shipments and follow their progress.",
    "إدارة الشحنات ومتابعة حالتها.",
  ],
  "shipping-companies-app": [
    "truck",
    "SETTINGS",
    "Manage shipping companies and their service settings.",
    "إدارة شركات الشحن وإعدادات خدماتها.",
  ],
  "states-app": [
    "map",
    "LOCATIONS",
    "Manage states and shipping-company naming mappings.",
    "إدارة المناطق ومسمياتها لدى شركات الشحن.",
  ],
  "topup-requests-app": [
    "credit-card",
    "PAYMENTS",
    "Track payments and keep your wallet funding in view.",
    "تابع عمليات الدفع وطلبات شحن محفظتك من مكان واحد.",
  ],
  "transaction-reports-app": [
    "document-report",
    "REPORTS",
    "Choose an account and reporting scope to review transactions.",
    "حدد الحساب ونطاق التقرير لمراجعة العمليات المالية.",
  ],
  "transactions-app": [
    "switch-horizontal",
    "PAYMENTS",
    "Review account transactions and balance adjustments.",
    "مراجعة العمليات المالية وتعديلات الأرصدة.",
  ],
  "verification-requests-app": [
    "badge-check",
    "ACCOUNTS",
    "Review merchant verification requests and documents.",
    "مراجعة طلبات توثيق التجار والمستندات.",
  ],
  "withdraw-requests-app": [
    "cash",
    "PAYMENTS",
    "Review withdrawal requests and payout details.",
    "مراجعة طلبات سحب الرصيد وتفاصيل الدفع.",
  ],
  dashboard: [
    "chart-pie",
    "OPERATIONS",
    "Review operations and financial performance.",
    "مراجعة العمليات والأداء المالي.",
  ],
  "home-app": [
    "home",
    "OPERATIONS",
    "Your shipments, balances and next steps in one place.",
    "شحناتك وأرصدتك وخطواتك التالية في مكان واحد.",
  ],
} as const;

i18next.addResourceBundle("en", "featureHeaders", {
  FILTERS: "Filters",
  ACCOUNTS: "ACCOUNTS & ACCESS",
  PAYMENTS: "WALLET & PAYMENTS",
  MANAGEMENT: "MANAGEMENT",
  OPERATIONS: "SHIPPING & OPERATIONS",
  LOCATIONS: "LOCATIONS",
  SETTINGS: "SHIPPING SETTINGS",
  REPORTS: "REPORTS & INSIGHTS",
  ...Object.fromEntries(
    Object.entries(features).map(([key, value]) => [key, value[2]]),
  ),
});
i18next.addResourceBundle("ar", "featureHeaders", {
  FILTERS: "تصفية",
  ACCOUNTS: "الحسابات والصلاحيات",
  PAYMENTS: "المحفظة والمدفوعات",
  MANAGEMENT: "الإدارة",
  OPERATIONS: "الشحن والعمليات",
  LOCATIONS: "المواقع الجغرافية",
  SETTINGS: "إعدادات الشحن",
  REPORTS: "التقارير والإحصاءات",
  ...Object.fromEntries(
    Object.entries(features).map(([key, value]) => [key, value[3]]),
  ),
});
export type HeaderFeature = keyof typeof features;
export default features;
