'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

interface Match {
  id: number;
  category: string;
  date: string;
  time: string;
  match: string;
  phase: string;
  competition: string;
  stream: string;
  streamUrl?: string;
}

interface CalendarViewProps {
  matches: Match[];
}

const getCategoryColor = (category: string) => {
  const colors = {
    'League of Legends': 'from-blue-500 to-cyan-500',
    'VALORANT': 'from-red-500 to-pink-500',
    'Rocket League': 'from-orange-500 to-yellow-500',
    'Apex Legends': 'from-purple-500 to-indigo-500',
    'Free Fire': 'from-green-500 to-emerald-500',
    'Honor of Kings': 'from-yellow-500 to-orange-500',
    'Pokémon': 'from-pink-500 to-rose-500',
    'Call of Duty': 'from-gray-500 to-slate-500',
  };
  return colors[category as keyof typeof colors] || 'from-violet-500 to-purple-500';
};

const getCategoryTextColor = (category: string) => {
  const textColors = {
    'League of Legends': 'text-blue-100',
    'VALORANT': 'text-red-100',
    'Rocket League': 'text-orange-100',
    'Apex Legends': 'text-purple-100',
    'Free Fire': 'text-green-100',
    'Honor of Kings': 'text-yellow-100',
    'Pokémon': 'text-pink-100',
    'Call of Duty': 'text-gray-100',
  };
  return textColors[category as keyof typeof textColors] || 'text-violet-100';
};

const getCategoryAccentColor = (category: string) => {
  const accentColors = {
    'League of Legends': 'text-cyan-300',
    'VALORANT': 'text-pink-300',
    'Rocket League': 'text-yellow-300',
    'Apex Legends': 'text-indigo-300',
    'Free Fire': 'text-emerald-300',
    'Honor of Kings': 'text-orange-300',
    'Pokémon': 'text-rose-300',
    'Call of Duty': 'text-slate-300',
  };
  return accentColors[category as keyof typeof accentColors] || 'text-purple-300';
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
  
  // Parse date (format: DD/MM/YYYY)
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year) {
    throw new Error('Invalid date format');
  }
  
  // Parse time (format: HH:MM)
  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) {
    throw new Error('Invalid time format');
  }
  
  // Create date object
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  
  if (isNaN(startDate.getTime())) {
    throw new Error('Invalid date/time values');
  }
  
  // End time (1 hour later)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  
  // Format dates for different calendar services
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const startFormatted = formatDate(startDate);
  const endFormatted = formatDate(endDate);
  
  // Event details
  const title = encodeURIComponent(match.match);
  const description = encodeURIComponent(`${match.phase} - ${match.competition}`);
  const location = encodeURIComponent('Online');
  
  // Google Calendar URL
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endFormatted}&details=${description}&location=${location}`;
  
  // Outlook Calendar URL
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startFormatted}&enddt=${endFormatted}&body=${description}&location=${location}`;
  
  // ICS file content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KOI Calendar//ES',
    'BEGIN:VEVENT',
    `UID:${match.id}@koicalendar.com`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${match.match}`,
    `DESCRIPTION:${match.phase} - ${match.competition}`,
    'LOCATION:Online',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return {
    google: googleUrl,
    outlook: outlookUrl,
    ics: icsContent
  };
};

const parseMatchDate = (match: Match): Date | null => {
  try {
    const dateStr = match.date?.trim();
    const timeStr = match.time?.trim();
    
    if (!dateStr || !timeStr || timeStr.toUpperCase() === 'TBD') {
      return null;
    }
    
    const monthMap: { [key: string]: string } = {
      'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
      'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
      'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
    };
    
    const parts = dateStr.split(' ');
    if (parts.length !== 2) return null;
    
    const day = parts[0].padStart(2, '0');
    const monthName = parts[1];
    const month = monthMap[monthName];
    
    if (!month) return null;
    
    const currentYear = new Date().getFullYear();
    const isoDateString = `${currentYear}-${month}-${day}T${timeStr}:00`;
    
    const date = new Date(isoDateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
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
                <div className="font-medium">Descargar archivo ICS</div>
                <div className="text-xs text-gray-400">Para otros calendarios</div>
              </div>
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function CalendarView({ matches }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const t = useTranslations();

  // Parse matches and group by date
  const matchesByDate = useMemo(() => {
    const grouped: { [key: string]: Match[] } = {};
    
    matches.forEach(match => {
      const matchDate = parseMatchDate(match);
      if (matchDate) {
        const dateKey = format(matchDate, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(match);
      }
    });
    
    return grouped;
  }, [matches]);

  // Get matches for selected date
  const selectedDateMatches = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return matchesByDate[dateKey] || [];
  }, [selectedDate, matchesByDate]);

  // Custom day content to show match indicators
  const modifiers = useMemo(() => {
    const hasMatches: Date[] = [];
    
    Object.keys(matchesByDate).forEach(dateKey => {
      const date = parseISO(dateKey);
      hasMatches.push(date);
    });
    
    return {
      hasMatches
    };
  }, [matchesByDate]);

  const modifiersClassNames = {
    hasMatches: 'relative after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-violet-500 after:rounded-full'
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a0b2e]/40 backdrop-blur-sm border border-[#2d3436]/50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {t('calendar.title')}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border border-[#2d3436]/50 bg-[#0d1117]/50"
              locale={es}
            />
          </div>
          
          {/* Selected Date Matches */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {selectedDate ? (
                <>
                  {t('calendar.eventsFor')} {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
                </>
              ) : (
                t('calendar.selectDate')
              )}
            </h3>
            
            {selectedDateMatches.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedDateMatches.map((match) => {
                  const matchDate = parseMatchDate(match);
                  const isPastMatch = matchDate && matchDate < new Date();
                  
                  return (
                    <div
                      key={match.id}
                      className={`relative p-4 rounded-lg border border-[#2d3436]/50 transition-all duration-300 ${
                        isPastMatch 
                          ? 'opacity-60 saturate-50 bg-gradient-to-r from-gray-800/20 to-gray-700/20'
                          : `bg-gradient-to-r ${getCategoryColor(match.category)}/10 hover:${getCategoryColor(match.category)}/20`
                      }`}
                    >
                      {isPastMatch && (
                        <div className="absolute top-2 left-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Finalizado
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            isPastMatch 
                              ? 'bg-gray-600 text-gray-300'
                              : `bg-gradient-to-r ${getCategoryColor(match.category)} text-white`
                          }`}>
                            {match.category}
                          </span>
                          <span className={`text-sm font-medium ${
                            isPastMatch ? 'text-gray-400' : getCategoryAccentColor(match.category)
                          }`}>
                            {match.time}
                          </span>
                        </div>
                        
                        <h4 className={`font-semibold ${
                          isPastMatch ? 'text-gray-300' : getCategoryTextColor(match.category)
                        }`}>
                          {match.match}
                        </h4>
                        
                        <div className="text-sm space-y-1">
                          <div className={`flex items-center ${
                            isPastMatch ? 'text-gray-300' : getCategoryAccentColor(match.category)
                          }`}>
                            <span className="w-2 h-2 bg-[#fd79a8] rounded-full mr-2"></span>
                            <span className={`mr-2 ${
                              isPastMatch ? 'text-gray-400' : 'text-gray-300'
                            }`}>{t('matches.phase')}</span>
                            <span>{match.phase}</span>
                          </div>
                          <div className={`flex items-center ${
                            isPastMatch ? 'text-gray-300' : getCategoryAccentColor(match.category)
                          }`}>
                            <span className="w-2 h-2 bg-[#00cec9] rounded-full mr-2"></span>
                            <span className={`mr-2 ${
                              isPastMatch ? 'text-gray-400' : 'text-gray-300'
                            }`}>{t('matches.competition')}</span>
                            <span>{match.competition}</span>
                          </div>
                        </div>
                        
                        {(match.stream || match.streamUrl) && (
                          <div className="mt-3 pt-3 border-t border-gray-600">
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
                                    className={`inline-flex items-center px-3 py-1 text-xs font-semibold transition-all duration-300 hover:scale-105 rounded-full ${
                                      isPastMatch 
                                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                                        : 'text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500'
                                    }`}
                                    {...(isPastMatch && { 'aria-disabled': 'true', onClick: (e) => e.preventDefault() })}
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
                        )}
                        
                        {/* Calendar Reminder Button - Only show for upcoming matches */}
                        {!isPastMatch && (
                          <CalendarButton
                            match={match}
                            isOpen={openDropdown === match.id}
                            onToggle={() => setOpenDropdown(openDropdown === match.id ? null : match.id)}
                            t={t}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-400">{t('calendar.noEvents')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}