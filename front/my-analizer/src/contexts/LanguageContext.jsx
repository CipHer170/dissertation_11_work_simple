import React, { createContext, useContext, useState, useCallback } from 'react';

// Define all translations
const translations = {
  en: {
    headers: {
      domain: 'Domain',
      ipAddress: 'IP Address',
      timestamp: 'Timestamp',
      protocol: 'Protocol',
      length: 'Length (bytes)',
      requestCount: 'Request Count',
      firstRequest: 'First Request',
      lastRequest: 'Last Request',
      select: 'Select',
      interface: 'Interface',
      status: 'Status',
      actions: 'Actions',
      devices: 'Connected Devices',
      totalData: 'Total Data',
      firstSeen: 'First Seen',
      lastSeen: 'Last Seen'
    },
    buttons: {
      refresh: 'Refresh Data',
      stop: 'Stop Capture',
      resetIp: 'Reset IP Filter',
      exportCsv: 'Export CSV',
      exportJson: 'Export JSON',
      language: 'Language',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      saveSelection: 'Save Selection',
      start: 'Start Capture',
      startOn: 'Start on',
      showAll: 'Show All',
      hideSelected: 'Hide Selected'
    },
    titles: {
      main: 'DNS Traffic Data',
      domains: 'Domain List',
      interfaces: 'Interface List',
      stats: 'Statistics',
      topDomains: 'Top Domains',
      deviceStats: 'Device Statistics',
      interfaceStats: 'Interface Statistics'
    },
    messages: {
      loading: 'Loading...',
      noData: 'No data available',
      noDomainsFound: 'No domains found',
      searchPlaceholder: 'Search domains...',
      selected: 'Selected',
      of: 'of',
      domains: 'domains',
      noInterface: 'No interfaces available',
      interfaceError: 'Error loading interfaces',
      startCapture: 'Started capture on interface',
      stopCapture: 'Stopped capture',
      errorCapture: 'Error during capture',
      loadingInterfaces: 'Loading interfaces...',
      loadingData: 'Loading data...',
      noDevices: 'No devices connected',
      connected: 'Connected',
      disconnected: 'Disconnected',
      active: 'Active',
      inactive: 'Inactive',
      totalDevices: 'Total Devices',
      totalRequests: 'Total Requests',
      totalData: 'Total Data',
      avgRequestSize: 'Average Request Size',
      bytes: 'bytes',
      kb: 'KB',
      mb: 'MB',
      nodescription:"No description",
      scanning:"Scanning",
      scanningActive:"Scanning Active",
      
    },
    notifications: {
      success: {
        saved: 'Selection saved successfully',
        started: 'Capture started successfully',
        stopped: 'Capture stopped successfully',
        updated: 'Data updated successfully'
      },
      error: {
        save: 'Error saving selection',
        start: 'Error starting capture',
        stop: 'Error stopping capture',
        update: 'Error updating data',
        load: 'Error loading data'
      }
    },
    table: {
      domain: 'Domain',
      ip: 'IP Address',
      time: 'Time',
      protocol: 'Protocol',
      length: 'Length',
      requests: 'Requests',
      firstSeen: 'First Seen',
      lastSeen: 'Last Seen'
    }
  },
  ru: {
    headers: {
      domain: 'Домен',
      ipAddress: 'IP-адрес',
      timestamp: 'Время',
      protocol: 'Протокол',
      length: 'Длина (байт)',
      requestCount: 'Количество запросов',
      firstRequest: 'Первый запрос',
      lastRequest: 'Последний запрос',
      select: 'Выбрать',
      interface: 'Интерфейс',
      status: 'Статус',
      actions: 'Действия',
      devices: 'Подключенные устройства',
      totalData: 'Всего данных',
      firstSeen: 'Первое появление',
      lastSeen: 'Последнее появление'
    },
    buttons: {
      refresh: 'Обновить данные',
      stop: 'Остановить захват',
      resetIp: 'Сбросить фильтр IP',
      exportCsv: 'Экспорт CSV',
      exportJson: 'Экспорт JSON',
      language: 'Язык',
      selectAll: 'Выбрать все',
      deselectAll: 'Снять выделение',
      saveSelection: 'Сохранить выбор',
      start: 'Начать захват',
      startOn: 'Начать на',
      showAll: 'Показать все',
      hideSelected: 'Скрыть выбранные'
    },
    titles: {
      main: 'Данные DNS трафика',
      domains: 'Список доменов',
      interfaces: 'Список интерфейсов',
      stats: 'Статистика',
      topDomains: 'Топ доменов',
      deviceStats: 'Статистика устройств',
      interfaceStats: 'Статистика интерфейса'
    },
    messages: {
      loading: 'Загрузка...',
      noData: 'Данные отсутствуют',
      noDomainsFound: 'Домены не найдены',
      searchPlaceholder: 'Поиск доменов...',
      selected: 'Выбрано',
      of: 'из',
      domains: 'доменов',
      noInterface: 'Нет доступных интерфейсов',
      interfaceError: 'Ошибка загрузки интерфейсов',
      startCapture: 'Начат захват на интерфейсе',
      stopCapture: 'Захват остановлен',
      errorCapture: 'Ошибка во время захвата',
      loadingInterfaces: 'Загрузка интерфейсов...',
      loadingData: 'Загрузка данных...',
      noDevices: 'Нет подключенных устройств',
      connected: 'Подключено',
      disconnected: 'Отключено',
      active: 'Активен',
      inactive: 'Неактивен',
      totalDevices: 'Всего устройств',
      totalRequests: 'Всего запросов',
      totalData: 'Всего данных',
      avgRequestSize: 'Средний размер запроса',
      bytes: 'байт',
      kb: 'КБ',
      mb: 'МБ',
      nodescription:"Без описания",
      scanning:"Сканирование",
      scanningActive:"Сканирование активно",
    },
    notifications: {
      success: {
        saved: 'Выбор успешно сохранен',
        started: 'Захват успешно начат',
        stopped: 'Захват успешно остановлен',
        updated: 'Данные успешно обновлены'
      },
      error: {
        save: 'Ошибка сохранения выбора',
        start: 'Ошибка запуска захвата',
        stop: 'Ошибка остановки захвата',
        update: 'Ошибка обновления данных',
        load: 'Ошибка загрузки данных'
      }
    },
    table: {
      domain: 'Домен',
      ip: 'IP-адрес',
      time: 'Время',
      protocol: 'Протокол',
      length: 'Длина',
      requests: 'Запросы',
      firstSeen: 'Первое появление',
      lastSeen: 'Последнее появление'
    }
  },
  kk: {
    headers: {
      domain: 'Домен',
      ipAddress: 'IP-мекенжай',
      timestamp: 'Ўақыт',
      protocol: 'Протокол',
      length: 'Узынлық (байт)',
      requestCount: 'Сораў саны',
      firstRequest: 'Биринши сораў',
      lastRequest: 'Соңғы сораў',
      select: 'Таңдаў',
      interface: 'Интерфейлер',
      status: 'Статус',
      actions: 'Ҳәрекетлер',
      devices: 'Қосылған қурылғылар',
      totalData: 'Барлық мағлыўматлар',
      firstSeen: 'Биринши көриниў',
      lastSeen: 'Соңғы көриниў'
    },
    buttons: {
      refresh: 'Жаңалаў',
      stop: 'Тутыў тоқтатылды',
      resetIp: 'IP сүзгіні тазалау',
      exportCsv: 'CSV экспорт',
      exportJson: 'JSON экспорт',
      language: 'Тил',
      selectAll: 'Барлығын таңдау',
      deselectAll: 'Таңдауды алып тастау',
      saveSelection: 'Таңдауды сақлау',
      start: 'Тутыўды баслаў',
      startOn: 'Баслаў',
      showAll: 'Барлығын көрсетиў',
      hideSelected: 'Таңдалғанларды жасырыў'
    },
    titles: {
      main: 'DNS трафик мағлыўматлары',
      domains: 'Доменлер дизими',
      interfaces: 'Интерфейслер дизими',
      stats: 'Статистика',
      topDomains: 'Топ доменлер',
      deviceStats: 'Қурылғы статистикасы',
      interfaceStats: 'Интерфейс статистикасы'
    },
    messages: {
      loading: 'Жүктелуде...',
      noData: 'Мағлыўматлар жоқ',
      noDomainsFound: 'Доменлер табылмады',
      searchPlaceholder: 'Доменлерди излеў...',
      selected: 'Таңдалған',
      of: 'ишинен',
      domains: 'доменлер',
      noInterface: 'Қол жетимли интерфейслер жоқ',
      interfaceError: 'Интерфейслерди жүклеўде қәте',
      startCapture: 'Интерфейсте тутыў басланды',
      stopCapture: 'Тутыў тоқтатылды',
      errorCapture: 'Тутыў ўақтында қәте',
      loadingInterfaces: 'Интерфейслер жүкленуде...',
      loadingData: 'Мағлыўматлар жүкленуде...',
      noDevices: 'Қосылған қурылғылар жоқ',
      connected: 'Қосылған',
      disconnected: 'Ажыратылған',
      active: 'Актив',
      inactive: 'Актив емес',
      totalDevices: 'Барлық қурылғылар',
      totalRequests: 'Барлық сораўлар',
      totalData: 'Барлық мағлыўматлар',
      avgRequestSize: 'Орташа сораў өлшеми',
      bytes: 'байт',
      kb: 'КБ',
      mb: 'МБ',
      nodescription:"Anıqlama joq ",
      scanning:"Skanerlew",
      scanningActive:"Skanerlew aktiv",
    },
    notifications: {
      success: {
        saved: 'Таңдаў сәтли сақланды',
        started: 'Тутыў сәтли басланды',
        stopped: 'Тутыў сәтли тоқтатылды',
        updated: 'Мағлыўматлар сәтли жаңаланды'
      },
      error: {
        save: 'Таңдаўды сақлаўда қәте',
        start: 'Тутыўды баслаўда қәте',
        stop: 'Тутыўды тоқтатыўда қәте',
        update: 'Мағлыўматларды жаңалаўда қәте',
        load: 'Мағлыўматларды жүклеўде қәте'
      }
    },
    table: {
      domain: 'Домен',
      ip: 'IP-мекенжай',
      time: 'Ўақыт',
      protocol: 'Протокол',
      length: 'Узынлық',
      requests: 'Сораўлар',
      firstSeen: 'Биринши көриниў',
      lastSeen: 'Соңғы көриниў'
    }
  },
  uz: {
    headers: {
      domain: 'Domen',
      ipAddress: 'IP manzil',
      timestamp: 'Vaqt',
      protocol: 'Protokol',
      length: 'Uzunlik (bayt)',
      requestCount: 'So\'rovlar soni',
      firstRequest: 'Birinchi so\'rov',
      lastRequest: 'Oxirgi so\'rov',
      select: 'Tanlash',
      interface: 'Interfeys',
      status: 'Holat',
      actions: 'Harakatlar',
      devices: "Ulangan qurilmalar",
      totalData: "Jami ma'lumotlar",
      firstSeen: 'Birinchi ko\'rinish',
      lastSeen: 'Oxirgi ko\'rinish'
    },
    buttons: {
      refresh: 'Yangilash',
      stop: 'To\'xtatish',
      resetIp: 'IP filtrni tiklash',
      exportCsv: 'CSV eksport',
      exportJson: 'JSON eksport',
      language: 'Til',
      selectAll: 'Barchasini tanlash',
      deselectAll: 'Tanlovni bekor qilish',
      saveSelection: 'Tanlovni saqlash',
      start: 'Yozishni boshlash',
      startOn: 'Boshlash',
      showAll: "Hammasini ko'rsatish",
      hideSelected: 'Tanlanganni yashirish'
    },
    titles: {
      main: 'DNS trafik ma\'lumotlari',
      domains: 'Domenlar ro\'yxati',
      interfaces: 'Interfeys ro\'yxati',
      stats: 'Statistika',
      topDomains: 'Top domenlar',
      deviceStats: 'Qurilma statistikasi',
      interfaceStats: 'Interfeys statistikasi'
    },
    messages: {
      loading: 'Yuklanmoqda...',
      noData: 'Ma\'lumot yo\'q',
      noDomainsFound: 'Domenlar topilmadi',
      searchPlaceholder: 'Domenlarni qidirish...',
      selected: 'Tanlangan',
      of: 'dan',
      domains: 'domenlar',
      noInterface: 'Interfeys mavjud emas',
      interfaceError: 'Interfeys yuklanishida xato',
      startCapture: 'Interfeysdagi yozuv boshlandi',
      stopCapture: 'Yozuv to\'xtatildi',
      errorCapture: 'Yozish vaqtida xato',
      loadingInterfaces: 'Interfeys yuklanmoqda...',
      loadingData: "Ma'lumotlar yuklanmoqda...",
      noDevices: 'Ulangan qurilmalar yo\'q',
      connected: 'Ulangan',
      disconnected: 'Uzilgan',
      active: 'Faol',
      inactive: 'Faol emas',
      totalDevices: 'Jami qurilmalar',
      totalRequests: "Jami so'rovlar",
      totalData: "Jami ma'lumotlar",
      avgRequestSize: "O'rtacha so'rov hajmi",
      bytes: 'bayt',
      kb: 'KB',
      mb: 'MB',
      nodescription:"Tavsifi yo'q"
    },
    notifications: {
      success: {
        saved: 'Tanlov muvaffaqiyatli saqlandi',
        started: 'Yozish muvaffaqiyatli boshlandi',
        stopped: "Yozish muvaffaqiyatli to'xtatildi",
        updated: "Ma'lumotlar muvaffaqiyatli yangilandi"
      },
      error: {
        save: 'Tanlovni saqlashda xato',
        start: 'Yozishni boshlashda xato',
        stop: "Yozishni to'xtatishda xato",
        update: "Ma'lumotlarni yangilashda xato",
        load: "Ma'lumotlarni yuklashda xato"
      }
    },
    table: {
      domain: 'Domen',
      ip: 'IP manzil',
      time: 'Vaqt',
      protocol: 'Protokol',
      length: 'Uzunlik',
      requests: "So'rovlar",
      firstSeen: 'Birinchi ko\'rinish',
      lastSeen: 'Oxirgi ko\'rinish'
    }
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const changeLanguage = useCallback((lang) => {
    setCurrentLang(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[currentLang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }, [currentLang]);

  return (
    <LanguageContext.Provider value={{ currentLang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 