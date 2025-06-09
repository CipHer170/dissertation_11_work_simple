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
      page: 'Page',
      pages: 'pages',
      total: 'Total',
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
    },
    stats: {
      totalRequests: 'Total Requests',
      totalData: 'Total Data',
      totalDevices: 'Total Devices',
      uniqueIPs: 'Unique IPs',
      averageRequestSize: 'Average Request Size',
      topDomains: 'Top Domains by Requests',
      requests: 'requests',
      bytes: 'bytes',
      kb: 'KB',
      top3Domains: 'Top 3 domains by requests:',
      updated: 'Updated',
      stats: 'Statistics'
    },
    alerts: {
      showingAllData: 'Showing all data',
      captureStopped: 'Capture stopped',
      captureStarted: 'Capture started on interface',
      captureError: 'Error during capture',
      loadingError: 'Error loading data',
      saveError: 'Error saving selection',
      startError: 'Error starting capture',
      stopError: 'Error stopping capture',
      updateError: 'Error updating data',
      loadError: 'Error loading data',
      noPermission: 'No permission to access network interfaces',
      interfaceNotFound: 'Interface not found',
      invalidInterface: 'Invalid interface selected',
      connectionError: 'Connection error',
      socketError: 'WebSocket connection error',
      exportError: 'Error exporting data',
      importError: 'Error importing data',
      clearConfirm: 'Are you sure you want to clear all logs?',
      stopConfirm: 'Are you sure you want to stop capture?',
      startConfirm: 'Are you sure you want to start capture?',
      yes: 'Yes',
      no: 'No',
      cancel: 'Cancel',
      confirm: 'Confirm'
    },
    tooltips: {
      time: "Time of the request",
      sourceIP: "Source IP address",
      destinationIP: "Destination IP address",
      domain: "Domain name",
      length: "Data length in bytes",
      previousPage: "Go to previous page",
      nextPage: "Go to next page",
      currentPage: "Current page number",
      uniqueIPs: "List of unique IP addresses",
      selectIP: "Click to show only this IP's data",
      deselectIP: "Click to show all data"
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
      page: 'Страница',
      pages: 'страниц',
      total: 'Всего',
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
    },
    stats: {
      totalRequests: 'Всего запросов',
      totalData: 'Общий объем данных',
      totalDevices: 'Всего устройств',
      uniqueIPs: 'Уникальных IP',
      averageRequestSize: 'Средний размер запроса',
      topDomains: 'Топ доменов по запросам',
      requests: 'запросов',
      bytes: 'байт',
      kb: 'КБ',
      top3Domains: 'Топ-3 домена по запросам:',
      updated: 'Обновлено',
      stats: 'Статистика'
    },
    alerts: {
      showingAllData: 'Отображаются все данные',
      captureStopped: 'Захват остановлен',
      captureStarted: 'Захват запущен на интерфейсе',
      captureError: 'Ошибка во время захвата',
      loadingError: 'Ошибка загрузки данных',
      saveError: 'Ошибка сохранения выбора',
      startError: 'Ошибка запуска захвата',
      stopError: 'Ошибка остановки захвата',
      updateError: 'Ошибка обновления данных',
      loadError: 'Ошибка загрузки данных',
      noPermission: 'Нет прав доступа к сетевым интерфейсам',
      interfaceNotFound: 'Интерфейс не найден',
      invalidInterface: 'Выбран неверный интерфейс',
      connectionError: 'Ошибка подключения',
      socketError: 'Ошибка WebSocket подключения',
      exportError: 'Ошибка экспорта данных',
      importError: 'Ошибка импорта данных',
      clearConfirm: 'Вы уверены, что хотите очистить все логи?',
      stopConfirm: 'Вы уверены, что хотите остановить захват?',
      startConfirm: 'Вы уверены, что хотите начать захват?',
      yes: 'Да',
      no: 'Нет',
      cancel: 'Отмена',
      confirm: 'Подтвердить'
    },
    tooltips: {
      time: "Время запроса",
      sourceIP: "IP-адрес источника",
      destinationIP: "IP-адрес назначения",
      domain: "Имя домена",
      length: "Длина данных в байтах",
      previousPage: "Перейти на предыдущую страницу",
      nextPage: "Перейти на следующую страницу",
      currentPage: "Номер текущей страницы",
      uniqueIPs: "Список уникальных IP-адресов",
      selectIP: "Нажмите, чтобы показать данные только этого IP",
      deselectIP: "Нажмите, чтобы показать все данные"
    }
  },
  kk: {
    headers: {
      domain: 'Домен',
      ipAddress: 'IP манзил',
      timestamp: 'Вақт',
      protocol: 'Протокол',
      length: 'Узунлиқ (байт)',
      requestCount: 'Сўровлар сони',
      firstRequest: 'Биринчи сўров',
      lastRequest: 'Охирги сўров',
      select: 'Танлаш',
      interface: 'Интерфейс',
      status: 'Ҳолат',
      actions: 'Амаллар',
      devices: 'Уланган қурилмалар',
      totalData: 'Жами маълумот',
      firstSeen: 'Биринчи кўриниш',
      lastSeen: 'Охирги кўриниш'
    },
    buttons: {
      refresh: 'Маълумотларни янгилаш',
      stop: 'Якунлаш',
      resetIp: 'IP фильтрни тиклаш',
      exportCsv: 'CSV экспорт',
      exportJson: 'JSON экспорт',
      language: 'Тил',
      selectAll: 'Барчасини танлаш',
      deselectAll: 'Барчасини бекор қилиш',
      saveSelection: 'Танловни сақлаш',
      start: 'Бошлаш',
      startOn: 'Бошлаш',
      showAll: 'Барчасини кўрсатиш',
      hideSelected: 'Танланганларни яшириш'
    },
    titles: {
      main: 'DNS трафик маълумотлари',
      domains: 'Доменлар рўйхати',
      interfaces: 'Интерфейслар рўйхати',
      stats: 'Статистика',
      topDomains: 'Топ доменлар',
      deviceStats: 'Қурилмалар статистикаси',
      interfaceStats: 'Интерфейс статистикаси'
    },
    messages: {
      loading: 'Юкланмоқда...',
      noData: 'Маълумот йўқ',
      noDomainsFound: 'Доменлар топилмади',
      searchPlaceholder: 'Доменларни қидириш...',
      selected: 'Танланган',
      of: 'дан',
      domains: 'домен',
      noInterface: 'Мавжуд интерфейслар йўқ',
      interfaceError: 'Интерфейсларни юклашда хатолик',
      startCapture: 'Интерфейсда якунланди',
      stopCapture: 'Якунланди',
      errorCapture: 'Якунлаш вақтида хатолик',
      loadingInterfaces: 'Интерфейслар юкланмоқда...',
      loadingData: 'Маълумотлар юкланмоқда...',
      noDevices: 'Уланган қурилмалар йўқ',
      connected: 'Уланди',
      disconnected: 'Узилди',
      active: 'Фаол',
      inactive: 'Нофаол',
      totalDevices: 'Жами қурилмалар',
      totalRequests: 'Жами сўровлар',
      totalData: 'Жами маълумот',
      avgRequestSize: 'Ўртача сўров ҳажми',
      bytes: 'байт',
      kb: 'КБ',
      mb: 'МБ',
      nodescription: "Тавсиф йўқ",
      scanning: "Сканерлаш",
      scanningActive: "Сканерлаш фаол",
      page: 'Саҳифа',
      pages: 'саҳифа',
      total: 'Жами',
    },
    notifications: {
      success: {
        saved: 'Танлов муваффақиятli сақланди',
        started: 'Якунлаш муваффақиятli бошланди',
        stopped: 'Якунлаш муваффақиятli тўхтатилди',
        updated: 'Маълумотлар муваффақиятli янгиланди'
      },
      error: {
        save: 'Танловни сақлашда хатолик',
        start: 'Якунлашни бошлашда хатолик',
        stop: 'Якунлашни тўхтатишда хатолик',
        update: 'Маълумотларни янгилашда хатолик',
        load: 'Маълумотларни юклашда хатолик'
      }
    },
    table: {
      domain: 'Домен',
      ip: 'IP манзил',
      time: 'Вақт',
      protocol: 'Протокол',
      length: 'Узунлиқ',
      requests: 'Сўровлар',
      firstSeen: 'Биринчи кўриниш',
      lastSeen: 'Охирги кўриниш'
    },
    stats: {
      totalRequests: 'Жами сұраныстар',
      totalData: 'Жалпы дерек көлемі',
      totalDevices: 'Жами құрылғылар',
      uniqueIPs: 'Бензелмес IP',
      averageRequestSize: 'Орташа сұраныс көлемі',
      topDomains: 'Сұраныстар бойынша топ домендер',
      requests: 'сұраныс',
      bytes: 'байт',
      kb: 'КБ',
      top3Domains: 'Сұраныстар бойынша топ-3 домен:',
      updated: 'Жаңартылды',
      stats: 'Статистика'
    },
    alerts: {
      showingAllData: 'Барлық деректер көрсетілуде',
      captureStopped: 'Жабылу тоқтатылды',
      captureStarted: 'Интерфейсте жабылу басталды',
      captureError: 'Жабылу уақытында қате',
      loadingError: 'Деректерді жүктеуде қате',
      saveError: 'Таңдауды сақтауда қате',
      startError: 'Жабылуды бастауда қате',
      stopError: 'Жабылуды тоқтатуда қате',
      updateError: 'Деректерді жаңартуда қате',
      loadError: 'Деректерді жүктеуде қате',
      noPermission: 'Тармақ интерфейстеріне кіру құқығы жоқ',
      interfaceNotFound: 'Интерфейс табылмады',
      invalidInterface: 'Қате интерфейс таңдалды',
      connectionError: 'Қосылу қатесі',
      socketError: 'WebSocket қосылу қатесі',
      exportError: 'Деректерді экспорттауда қате',
      importError: 'Деректерді импорттауда қате',
      clearConfirm: 'Барлық логтерді тазалағыңыз келе ме?',
      stopConfirm: 'Жабылуды тоқтатқыңыз келе ме?',
      startConfirm: 'Жабылуды бастағыңыз келе ме?',
      yes: 'Иә',
      no: 'Жоқ',
      cancel: 'Бас тарту',
      confirm: 'Растау'
    },
    tooltips: {
      time: "Сұраныс уақыты",
      sourceIP: "Көз IP мекенжайы",
      destinationIP: "Мақсат IP мекенжайы",
      domain: "Домен атауы",
      length: "Деректер көлемі байтпен",
      previousPage: "Алдыңғы бетке өту",
      nextPage: "Келесі бетке өту",
      currentPage: "Ағымдағы бет нөмірі",
      uniqueIPs: "Бірегей IP мекенжайлар тізімі",
      selectIP: "Тек осы IP деректерін көрсету үшін басыңыз",
      deselectIP: "Барлық деректерді көрсету үшін басыңыз"
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
      refresh: 'Ma\'lumotlarni yangilash',
      stop: 'Yakunlash',
      resetIp: 'IP filterni tiklash',
      exportCsv: 'CSV eksport',
      exportJson: 'JSON eksport',
      language: 'Til',
      selectAll: 'Barchasini tanlash',
      deselectAll: 'Barchasini bekor qilish',
      saveSelection: 'Tanlovni saqlash',
      start: 'Boshlash',
      startOn: 'Boshlash',
      showAll: 'Barchasini ko\'rsatish',
      hideSelected: 'Tanlanganlarni yashirish'
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
      domains: 'domen',
      noInterface: 'Mavjud interfeyslar yo\'q',
      interfaceError: 'Interfeyslarni yuklashda xatolik',
      startCapture: 'Interfeysda yakunlandi',
      stopCapture: 'Yakunlandi',
      errorCapture: 'Yakunlash vaqtida xatolik',
      loadingInterfaces: 'Interfeyslar yuklanmoqda...',
      loadingData: 'Ma\'lumotlar yuklanmoqda...',
      noDevices: 'Ulangan qurilmalar yo\'q',
      connected: 'Ulandi',
      disconnected: 'Uzildi',
      active: 'Faol',
      inactive: 'Nofaol',
      totalDevices: 'Jami qurilmalar',
      totalRequests: 'Jami so\'rovlar',
      totalData: 'Jami ma\'lumot',
      avgRequestSize: 'O\'rtacha so\'rov hajmi',
      bytes: 'bayt',
      kb: 'KB',
      mb: 'MB',
      nodescription: "Tavsif yo\'q",
      scanning: "Skanerlash",
      scanningActive: "Skanerlash faol",
      page: 'Sahifa',
      pages: 'sahifa',
      total: 'Jami',
    },
    notifications: {
      success: {
        saved: 'Tanlov muvaffaqiyatli saqlandi',
        started: 'Yakunlash muvaffaqiyatli boshlandi',
        stopped: 'Yakunlash muvaffaqiyatli to\'xtatildi',
        updated: 'Ma\'lumotlar muvaffaqiyatli yangilandi'
      },
      error: {
        save: 'Tanlovni saqlashda xatolik',
        start: 'Yakunlashni boshlashda xatolik',
        stop: 'Yakunlashni to\'xtatishda xatolik',
        update: 'Ma\'lumotlarni yangilashda xatolik',
        load: 'Ma\'lumotlarni yuklashda xatolik'
      }
    },
    table: {
      domain: 'Domen',
      ip: 'IP manzil',
      time: 'Vaqt',
      protocol: 'Protokol',
      length: 'Uzunlik',
      requests: 'So\'rovlar',
      firstSeen: 'Birinchi ko\'rinish',
      lastSeen: 'Oxirgi ko\'rinish'
    },
    stats: {
      totalRequests: 'Jami so\'rovlar',
      totalData: 'Umumiy ma\'lumot hajmi',
      totalDevices: 'Jami qurilmalar',
      uniqueIPs: 'Benzetilmas IP',
      averageRequestSize: 'O\'rtacha so\'rov hajmi',
      topDomains: 'So\'rovlar bo\'yicha top domenlar',
      requests: 'so\'rov',
      bytes: 'bayt',
      kb: 'KB',
      top3Domains: 'So\'rovlar bo\'yicha top-3 domen:',
      updated: 'Yangilandi',
      stats: 'Statistika'
    },
    alerts: {
      showingAllData: 'Barcha ma\'lumotlar ko\'rsatilmoqda',
      captureStopped: 'Yakunlash to\'xtatildi',
      captureStarted: 'Interfeysda yakunlash boshlandi',
      captureError: 'Yakunlash vaqtida xatolik',
      loadingError: 'Ma\'lumotlarni yuklashda xatolik',
      saveError: 'Tanlovni saqlashda xatolik',
      startError: 'Yakunlashni boshlashda xatolik',
      stopError: 'Yakunlashni to\'xtatishda xatolik',
      updateError: 'Ma\'lumotlarni yangilashda xatolik',
      loadError: 'Ma\'lumotlarni yuklashda xatolik',
      noPermission: 'Tarmoq interfeyslariga kirish huquqi yo\'q',
      interfaceNotFound: 'Interfeys topilmadi',
      invalidInterface: 'Noto\'g\'ri interfeys tanlandi',
      connectionError: 'Ulanish xatosi',
      socketError: 'WebSocket ulanish xatosi',
      exportError: 'Ma\'lumotlarni eksport qilishda xatolik',
      importError: 'Ma\'lumotlarni import qilishda xatolik',
      clearConfirm: 'Barcha loglarni tozalashni xohlaysizmi?',
      stopConfirm: 'Yakunlashni to\'xtatishni xohlaysizmi?',
      startConfirm: 'Yakunlashni boshlashni xohlaysizmi?',
      yes: 'Ha',
      no: 'Yo\'q',
      cancel: 'Bekor qilish',
      confirm: 'Tasdiqlash'
    },
    tooltips: {
      time: "So'rov vaqti",
      sourceIP: "Manba IP manzili",
      destinationIP: "Maqsad IP manzili",
      domain: "Domen nomi",
      length: "Ma'lumotlar hajmi baytlarda",
      previousPage: "Oldingi sahifaga o'tish",
      nextPage: "Keyingi sahifaga o'tish",
      currentPage: "Joriy sahifa raqami",
      uniqueIPs: "Nozik IP manzillar ro'yxati",
      selectIP: "Faqat bu IP ma'lumotlarini ko'rsatish uchun bosing",
      deselectIP: "Barcha ma'lumotlarni ko'rsatish uchun bosing"
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