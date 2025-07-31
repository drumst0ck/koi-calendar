'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createPortal } from 'react-dom';
import LanguageSelector from '../components/LanguageSelector';
import CalendarView from '../components/CalendarView';
import Head from 'next/head';

// Utility function to create calendar events
const createCalendarEvent = (match: Match) => {
  // Validate and parse date/time
  const dateStr = match.date?.trim();
  const timeStr = match.time?.trim();
  
  if (!dateStr || !timeStr) {
    throw new Error('Invalid date or time value');
  }
  
  // Skip matches with TBD time
  if (timeStr.toUpperCase() === 'TBD') {
    throw new Error('Time is TBD (To Be Determined)');
  }
  
  // Convert Spanish date format to ISO format
  const parseSpanishDate = (spanishDate: string): string => {
    const monthMap: { [key: string]: string } = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };
    
    // Parse "DD Mes" format
    const parts = spanishDate.toLowerCase().split(' ');
    if (parts.length !== 2) {
      throw new Error(`Invalid date format: ${spanishDate}`);
    }
    
    const day = parts[0].padStart(2, '0');
    const monthName = parts[1];
    const month = monthMap[monthName];
    
    if (!month) {
      throw new Error(`Unknown month: ${monthName}`);
    }
    
    // Assume current year for now
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${month}-${day}`;
  };
  
  // Convert date and create ISO string
  const isoDate = parseSpanishDate(dateStr);
  const dateTimeStr = `${isoDate}T${timeStr}`;
  const startDate = new Date(dateTimeStr);
  
  // Check if the date is valid
  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid date/time: ${dateTimeStr}`);
  }
  
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
  
  const formatDate = (date: Date) => {
    if (isNaN(date.getTime())) {
      throw new Error('Invalid time value');
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const eventDetails = {
    title: `${match.match} - ${match.category}`,
    start: formatDate(startDate),
    end: formatDate(endDate),
    description: `${match.phase} - ${match.competition}\n\nStream: ${match.stream}`,
    location: 'Online'
  };
  
  // Google Calendar URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${eventDetails.start}/${eventDetails.end}&details=${encodeURIComponent(eventDetails.description)}&location=${encodeURIComponent(eventDetails.location)}`;
  
  // Outlook Calendar URL
  const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventDetails.title)}&startdt=${eventDetails.start}&enddt=${eventDetails.end}&body=${encodeURIComponent(eventDetails.description)}&location=${encodeURIComponent(eventDetails.location)}`;
  
  // ICS file content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KOI Calendar//EN
BEGIN:VEVENT
UID:${match.id}-${Date.now()}@koicalendar.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${eventDetails.start}
DTEND:${eventDetails.end}
SUMMARY:${eventDetails.title}
DESCRIPTION:${eventDetails.description.replace(/\n/g, '\\n')}
LOCATION:${eventDetails.location}
END:VEVENT
END:VCALENDAR`;
  
  return {
    google: googleCalendarUrl,
    outlook: outlookCalendarUrl,
    ics: icsContent
  };
};

// Function to download ICS file
const downloadICSFile = (icsContent: string, filename: string) => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Custom hook for fetching matches
const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches');
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      
      const data = await response.json();
      setMatches(data.matches || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return { matches, loading, error, refetch: fetchMatches };
};

interface Match {
  id: number;
  category: string;
  date: string;
  time: string;
  match: string;
  phase: string;
  competition: string;
  stream: string;
  streamUrl?: string; // URL real del hipervínculo
}

// Los datos ahora se obtienen dinámicamente desde la API

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'valorant':
      return 'from-pink-500 to-rose-400';
    case 'league of legends':
      return 'from-blue-500 to-cyan-400';
    case 'cs2':
    case 'counter-strike 2':
      return 'from-amber-500 to-orange-400';
    case 'rocket league':
      return 'from-violet-500 to-purple-400';
    case 'fortnite':
      return 'from-emerald-500 to-green-400';
    case 'apex legends':
      return 'from-slate-500 to-gray-400';
    case 'warzone':
      return 'from-red-500 to-pink-400';
    case 'call of duty':
        return 'from-indigo-500 to-blue-400';
    case 'fifa':
      return 'from-green-500 to-emerald-400';
    case 'free fire':
      return 'from-orange-500 to-yellow-400';
    default:
      return 'from-violet-500 to-indigo-400';
  }
};



const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'league of legends':
      return '/lol.webp';
    case 'valorant':
      return '/valorant.webp';
    case 'warzone':
      return '/warzone.webp';
    case 'apex legends':
      return '/apexlegends.webp';
    case 'free fire':
      return '/freefire.webp';
    case 'rocket league':
      return '/rocketleague.webp';
    case 'pokemon':
      return '/pokemon.webp';
    case 'honor of kings':
      return '/honorkings.webp';
    default:
      return null;
  }
};

const parseStreams = (streamText: string, streamUrl?: string) => {
  // If we have a direct URL, use it
  if (streamUrl) {
    let platform = 'Twitch'; // Default platform
    let displayName = streamText;
    
    // Detect platform from URL
    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
      platform = 'YouTube';
    } else if (streamUrl.includes('twitch.tv')) {
      platform = 'Twitch';
    }
    
    return [{ url: streamUrl, platform, original: streamText, displayName }];
  }
  
  // Fallback to old parsing logic for backward compatibility
  let streams: string[] = [];
  
  // Handle different stream formats
  if (streamText.includes('twitch/')) {
    // Extract everything after 'twitch/' and split by '/'
    const twitchPart = streamText.substring(streamText.indexOf('twitch/') + 7);
    const twitchChannels = twitchPart.split('/');
    streams = twitchChannels.map(channel => `twitch/${channel}`);
  } else if (streamText.includes('youtube/')) {
    // Extract everything after 'youtube/' and split by '/'
    const youtubePart = streamText.substring(streamText.indexOf('youtube/') + 8);
    const youtubeChannels = youtubePart.split('/');
    streams = youtubeChannels.map(channel => `youtube/${channel}`);
  } else {
    // Handle space or comma separated streams
    streams = streamText.split(/[,\s]+/).filter(s => s.length > 0);
  }
  
  return streams.map((stream, index) => {
    let url = '';
    let platform = 'Twitch'; // Default platform
    let displayName = stream;
    
    // Convert stream text to proper URL
    if (stream.includes('twitch/')) {
      const channelName = stream.replace('twitch/', '');
      url = `https://twitch.tv/${channelName}`;
      platform = 'Twitch';
      displayName = channelName;
    } else if (stream.includes('youtube/')) {
      const channelName = stream.replace('youtube/', '');
      url = `https://youtube.com/@${channelName}`;
      platform = 'YouTube';
      displayName = channelName;
    } else if (stream.startsWith('twitch.tv/')) {
      url = `https://${stream}`;
      platform = 'Twitch';
      displayName = stream.replace('twitch.tv/', '');
    } else if (stream.startsWith('youtube.com/')) {
      url = `https://${stream}`;
      platform = 'YouTube';
      displayName = stream.replace('youtube.com/@', '').replace('youtube.com/', '');
    } else {
      // For streamers without platform prefix, assume Twitch
      url = `https://twitch.tv/${stream}`;
      platform = 'Twitch';
      displayName = stream;
    }
    
    return { url, platform, original: stream, displayName };
  });
};

// Calendar Button Component
const CalendarButton = ({ match, isOpen, onToggle, t }: {
  match: Match;
  isOpen: boolean;
  onToggle: () => void;
  t: any;
}) => {

  return (
    <div className="mt-4 pt-4 border-t border-[#2d3436]/50 group-hover:border-[#6c5ce7]/30 transition-colors relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('Calendar button clicked for match:', match);
          onToggle();
        }}
        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-green-500 hover:to-emerald-500 rounded-lg transition-all duration-300 hover:scale-105 koi-glow-hover"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {t('matches.addToCalendar')}
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <CalendarModal
        isOpen={isOpen}
        onClose={onToggle}
        match={match}
        t={t}
      />
    </div>
  );
};

const CalendarModal = ({ isOpen, onClose, match, t }: {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  t: any;
}) => {
  if (!isOpen || typeof window === 'undefined') return null;

  // Detectar si es un dispositivo Apple (iOS/macOS)
  const isAppleDevice = () => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent;
    return /iPad|iPhone|iPod|Macintosh/.test(userAgent);
  };

  // Función para crear archivo ICS y abrirlo en el calendario nativo de Apple
    const openAppleCalendar = () => {
      try {
        const calendarEvent = createCalendarEvent(match);
        
        // Crear data URL para el archivo ICS
        const dataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarEvent.ics)}`;
        
        // Detectar el dispositivo
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isMac = /Macintosh/.test(userAgent);
        
        if (isIOS) {
          // Para iOS: usar data URL que iOS puede abrir directamente
          window.open(dataUrl, '_blank');
        } else if (isMac) {
          // Para macOS: usar data URL que macOS puede abrir con Calendar.app
          window.open(dataUrl, '_blank');
        } else {
          // Fallback para otros dispositivos: descargar archivo
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${match.match.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        
        onClose();
       } catch (error) {
         console.error('Error creating calendar event:', error);
         alert('Error: Fecha u hora inválida para este partido');
       }
     };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#2d3436] border border-[#636e72]/50 rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#636e72]/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{t('matches.addToCalendar')}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">{match.match}</p>
        </div>
        
        {/* Options */}
        <div className="py-2">
          {/* Botón específico para dispositivos Apple */}
          {isAppleDevice() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Apple Calendar button clicked for match:', match);
                openAppleCalendar();
              }}
              className="w-full px-6 py-4 text-left text-white hover:bg-[#636e72]/30 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <div>
                <div className="font-medium">Calendario de Apple</div>
                <div className="text-xs text-gray-400">Abrir en Calendario (iOS/macOS)</div>
              </div>
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Google Calendar button clicked for match:', match);
              try {
                const calendarEvent = createCalendarEvent(match);
                console.log('Calendar event created:', calendarEvent);
                window.open(calendarEvent.google, '_blank');
                onClose();
              } catch (error) {
                console.error('Error creating calendar event:', error);
                alert('Error: Fecha u hora inválida para este partido');
              }
            }}
            className="w-full px-6 py-4 text-left text-white hover:bg-[#636e72]/30 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div>
              <div className="font-medium">Google Calendar</div>
              <div className="text-xs text-gray-400">Abrir en Google Calendar</div>
            </div>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              try {
                const calendarEvent = createCalendarEvent(match);
                window.open(calendarEvent.outlook, '_blank');
                onClose();
              } catch (error) {
                console.error('Error creating calendar event:', error);
                alert('Error: Fecha u hora inválida para este partido');
              }
            }}
            className="w-full px-6 py-4 text-left text-white hover:bg-[#636e72]/30 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.462 0H0v24h7.462V0zM24 5.385H9.231v4.615H24V5.385zM24 14.769H9.231V24H24v-9.231z"/>
            </svg>
            <div>
              <div className="font-medium">Outlook Calendar</div>
              <div className="text-xs text-gray-400">Abrir en Outlook</div>
            </div>
          </button>
          
          <button
              onClick={(e) => {
                e.stopPropagation();
                try {
                  const calendarEvent = createCalendarEvent(match);
                  const blob = new Blob([calendarEvent.ics], { type: 'text/calendar' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${match.match.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  onClose();
                } catch (error) {
                  console.error('Error creating calendar event:', error);
                  alert('Error: Fecha u hora inválida para este partido');
                }
              }}
            className="w-full px-6 py-4 text-left text-white hover:bg-[#636e72]/30 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <div className="font-medium">{t('matches.downloadICS')}</div>
              <div className="text-xs text-gray-400">Descargar archivo .ics</div>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const { matches, loading, error } = useMatches();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredMatches, setFilteredMatches] = useState(matches);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list');

  // No need for global click handler since we use backdrop in portal

  // Generate structured data for sports events
  const generateSportsEventStructuredData = () => {
    if (!matches || matches.length === 0) return null;
    
    const events = matches.slice(0, 10)
      .filter(match => {
        // Filter out matches with invalid dates or TBD times
        const dateStr = match.date?.trim();
        const timeStr = match.time?.trim();
        if (!dateStr || !timeStr || timeStr.toUpperCase() === 'TBD') return false;
        
        try {
          // Use the same Spanish date parsing logic
          const monthMap: { [key: string]: string } = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
            'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
            'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
          };
          
          const parts = dateStr.toLowerCase().split(' ');
          if (parts.length !== 2) return false;
          
          const day = parts[0].padStart(2, '0');
          const monthName = parts[1];
          const month = monthMap[monthName];
          
          if (!month) return false;
          
          const currentYear = new Date().getFullYear();
          const isoDate = `${currentYear}-${month}-${day}`;
          const testDate = new Date(`${isoDate}T${timeStr}`);
          return !isNaN(testDate.getTime());
        } catch {
          return false;
        }
      })
      .map(match => {
         // Convert Spanish date to ISO format for structured data
         const monthMap: { [key: string]: string } = {
           'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
           'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
           'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
         };
         
         const parts = match.date.toLowerCase().split(' ');
         const day = parts[0].padStart(2, '0');
         const month = monthMap[parts[1]];
         const currentYear = new Date().getFullYear();
         const isoDate = `${currentYear}-${month}-${day}`;
         
         return {
            "@type": "SportsEvent",
            "name": match.match,
            "description": `${match.phase} - ${match.competition}`,
            "sport": match.category,
            "startDate": `${isoDate}T${match.time}`,
            "competitor": [
              {
                "@type": "SportsTeam",
                "name": "KOI"
              }
            ],
            "location": {
              "@type": "VirtualLocation",
              "name": "Online"
            },
            "organizer": {
              "@type": "Organization",
              "name": "KOI Esports"
            }
          };
        })

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Próximos Partidos de KOI",
      "description": "Lista de próximos partidos del equipo de esports KOI",
      "itemListElement": events.map((event, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": event
      }))
    };
  };

  const structuredData = generateSportsEventStructuredData();

  const categories = ['all', ...Array.from(new Set(matches.map(match => match.category)))];

  // Function to parse Spanish date and create Date object
  const parseMatchDate = (match: Match): Date | null => {
    try {
      const dateStr = match.date?.trim();
      const timeStr = match.time?.trim();
      
      if (!dateStr || !timeStr || timeStr.toUpperCase() === 'TBD') {
        return null;
      }
      
      const monthMap: { [key: string]: string } = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
      };
      
      const parts = dateStr.toLowerCase().split(' ');
      if (parts.length !== 2) return null;
      
      const day = parts[0].padStart(2, '0');
      const monthName = parts[1];
      const month = monthMap[monthName];
      
      if (!month) return null;
      
      const currentYear = new Date().getFullYear();
      const isoDate = `${currentYear}-${month}-${day}`;
      const matchDate = new Date(`${isoDate}T${timeStr}`);
      
      return isNaN(matchDate.getTime()) ? null : matchDate;
    } catch {
      return null;
    }
  };

  // Function to sort matches: upcoming first (by date), then past matches last
  const sortMatches = (matchesToSort: Match[]): Match[] => {
    const now = new Date();
    const matchesWithDates = matchesToSort.map(match => ({
      ...match,
      parsedDate: parseMatchDate(match)
    }));
    
    // Separate matches into upcoming and past
    const upcomingMatches = matchesWithDates.filter(match => 
      match.parsedDate && match.parsedDate > now
    );
    const pastMatches = matchesWithDates.filter(match => 
      match.parsedDate && match.parsedDate <= now
    );
    const invalidMatches = matchesWithDates.filter(match => !match.parsedDate);
    
    // Sort upcoming matches by date (earliest first)
    upcomingMatches.sort((a, b) => {
      if (!a.parsedDate || !b.parsedDate) return 0;
      return a.parsedDate.getTime() - b.parsedDate.getTime();
    });
    
    // Sort past matches by date (most recent first)
    pastMatches.sort((a, b) => {
      if (!a.parsedDate || !b.parsedDate) return 0;
      return b.parsedDate.getTime() - a.parsedDate.getTime();
    });
    
    // Return: upcoming matches first, then past matches, then invalid dates
    return [...upcomingMatches, ...pastMatches, ...invalidMatches].map(({ parsedDate, ...match }) => match);
  };

  useEffect(() => {
    let filtered: Match[];
    
    if (selectedCategory === 'all') {
      filtered = matches;
    } else {
      filtered = matches.filter(match => match.category === selectedCategory);
    }
    
    // Apply sorting to filtered matches
    const sorted = sortMatches(filtered);
    setFilteredMatches(sorted);
  }, [selectedCategory, matches]);

  return (
    <div className="min-h-screen text-white">
      {/* Structured Data for SEO */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] via-[#0d0d0d] to-[#1a0b2e] opacity-70"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-violet-500/15 to-cyan-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-60"></div>
          <div className="absolute top-40 right-10 w-64 h-64 bg-gradient-to-r from-blue-500/15 to-emerald-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000 opacity-60"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 bg-gradient-to-r from-pink-500/15 to-violet-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000 opacity-60"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full mix-blend-multiply filter blur-2xl animate-pulse opacity-50"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center space-y-8">
            {/* Logo/Brand */}
            <div className="inline-flex items-center space-x-3 mb-8">
              <img 
                src="/logokoi.svg" 
                alt="KOI Logo" 
                className="w-12 h-12"
              />
            
            </div>

            {/* Language Selector */}
            <div className="absolute top-4 right-4">
              <LanguageSelector currentLocale={locale} />
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-shadow text-white">
              {t('hero.title')}
              <br />
              <span className="text-[#6c5ce7]">
                {t('hero.titleHighlight')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed text-shadow">
              {t('hero.subtitle')}
              <br className="hidden md:block" />
              {t('hero.subtitleSecond')}
            </p>

            {/* CTA Button */}
            <div className="pt-8">
              <button 
                onClick={() => document.getElementById('matches')?.scrollIntoView({ behavior: 'smooth' })}
                className="koi-button group relative inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105 koi-glow-hover"
              >
                {t('hero.cta')}
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="relative py-16 border-t border-[#2d3436]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">{t('matches.title')}</h2>
            <p className="text-gray-300 text-lg">{t('matches.subtitle')}</p>
          </div>
          
          {/* View Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-[#2d3436]/30 rounded-full p-1 border border-[#636e72]/50">
              <button
                onClick={() => setCurrentView('list')}
                className={`inline-flex items-center space-x-2 px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  currentView === 'list'
                    ? 'koi-button text-white koi-glow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Lista</span>
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`inline-flex items-center space-x-2 px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  currentView === 'calendar'
                    ? 'koi-button text-white koi-glow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{t('calendar.title')}</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => {
              const icon = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 border backdrop-blur-sm ${
                    selectedCategory === category
                      ? 'koi-button text-white border-transparent koi-glow'
                      : 'bg-[#2d3436]/30 text-gray-300 border-[#636e72]/50 hover:border-[#6c5ce7] hover:text-white hover:bg-[#2d3436]/50 koi-glow-hover'
                  }`}
                >
                  
                  <span>{t(`categories.${category}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Matches Section */}
      <section id="matches" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin koi-glow">
                <div className="w-8 h-8 bg-[#0d0d0d] rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">{t('matches.loading')}</h3>
              <p className="text-gray-400 text-lg">{t('matches.loadingDescription')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">{t('matches.error')}</h3>
              <p className="text-gray-400 text-lg mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="koi-button px-6 py-3 rounded-lg transition-all duration-300 koi-glow-hover"
              >
                {t('matches.retry')}
              </button>
            </div>
          ) : filteredMatches.length > 0 ? (
            currentView === 'calendar' ? (
              <CalendarView matches={filteredMatches} />
            ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMatches.map((match) => {
                const matchDate = parseMatchDate(match);
                const isPastMatch = matchDate && matchDate <= new Date();
                
                return (
                  <div
                    key={match.id}
                    className={`group relative koi-card rounded-2xl p-6 hover:transform hover:scale-[1.02] transition-all duration-500 overflow-visible ${
                      isPastMatch ? 'opacity-60 saturate-50' : ''
                    }`}
                  >
                    {/* Past match indicator */}
                    {isPastMatch && (
                      <div className="absolute top-4 left-4 z-20">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-gray-600/80 rounded-full text-xs text-gray-300">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          <span>Finalizado</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      isPastMatch ? 'from-gray-500/10 to-gray-600/10' : 'from-violet-500/10 to-cyan-500/10'
                    }`}></div>
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${
                          isPastMatch ? 'from-gray-500 to-gray-600' : getCategoryColor(match.category)
                        }`}>
                          {match.category}
                        </span>
                        <div className="text-right">
                          <div className={`font-semibold text-sm ${
                            isPastMatch ? 'text-gray-400' : 'text-white'
                          }`}>{match.date}</div>
                          <div className="text-gray-400 text-xs">{match.time}</div>
                        </div>
                      </div>

                    {/* Match details */}
                    <div className="space-y-4">
                      <h3 className="text-white font-bold text-lg leading-tight group-hover:text-[#00cec9] transition-colors">
                        {match.match}
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-300">
                          <span className="w-2 h-2 bg-[#6c5ce7] rounded-full mr-3"></span>
                          <span className="text-gray-400 mr-2">{t('matches.phase')}</span>
                          <span>{match.phase}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <span className="w-2 h-2 bg-[#00cec9] rounded-full mr-3"></span>
                          <span className="text-gray-400 mr-2">{t('matches.competition')}</span>
                          <span>{match.competition}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stream info */}
                      <div className="mt-6 pt-4 border-t border-[#2d3436]/50 group-hover:border-[#6c5ce7]/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-[#fd79a8] rounded-full animate-pulse"></div>
                            <span className="text-gray-400 text-sm">{t('matches.stream')}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            {parseStreams(match.stream, match.streamUrl).map((stream, index) => (
                              <a
                                key={index}
                                href={stream.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 rounded-full transition-all duration-300 hover:scale-105 koi-glow-hover"
                              >
                                {stream.platform === 'YouTube' ? (
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24L11.57 19.714h4.286L24 11.571V0zm16.286 10.857l-4.286 4.286H9.714L7.714 17.143v-2H2.571V1.714H22.286z"/>
                                  </svg>
                                )}
                                {stream.displayName}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Calendar Reminder Button - Only show for upcoming matches */}
                      {(() => {
                        const matchDate = parseMatchDate(match);
                        const isPastMatch = matchDate && matchDate < new Date();
                        return !isPastMatch ? (
                          <CalendarButton
                            match={match}
                            isOpen={openDropdown === match.id}
                            onToggle={() => setOpenDropdown(openDropdown === match.id ? null : match.id)}
                            t={t}
                          />
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
            )
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50 koi-glow">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">{t('matches.noMatches')}</h3>
              <p className="text-gray-400 text-lg">{t('matches.noMatchesDescription')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2d3436]/50 bg-[#1a0b2e]/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <img 
                src="/logokoi.svg" 
                alt="KOI Logo" 
                className="w-10 h-10"
              />
              <span className="text-lg font-bold text-white">KOI Calendar</span>
            </div>
            
           
            
            <div className="text-gray-400 max-w-3xl mx-auto mb-6 text-center">
              <p className="mb-3">
                {t('footer.openSource')}
              </p>
              <p className="mb-3">
                {t('footer.specialThanks')}{' '}
                <a
                  href="https://x.com/aike0070"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-violet-400 transition-colors underline underline-offset-4 font-semibold"
                >
                  @aike0070
                </a>
                {' '}{t('footer.sheetMaintainer')}
              </p>
              <p>
                {t('footer.developedBy')}{' '}
                <a
                  href="https://github.com/drumst0ck"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-violet-400 transition-colors underline underline-offset-4 font-semibold"
                >
                  drumst0ck
                </a>
                {' '}|{' '}
                <a
                  href="https://github.com/drumst0ck/koi-calendar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-violet-400 transition-colors underline underline-offset-4 font-semibold"
                >
                  {t('footer.viewOnGitHub')}
                </a>
              </p>
            </div>
            
            <div className="pt-6 text-sm text-gray-500">
              {t('footer.copyright')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
