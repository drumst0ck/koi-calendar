'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslations } from 'next-intl';

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

export default function CalendarView({ matches }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
                            isPastMatch ? 'text-gray-400' : 'text-white'
                          }`}>
                            {match.time}
                          </span>
                        </div>
                        
                        <h4 className={`font-semibold ${
                          isPastMatch ? 'text-gray-300' : 'text-white'
                        }`}>
                          {match.match}
                        </h4>
                        
                        <div className="text-sm space-y-1">
                          <div className="flex items-center text-gray-300">
                            <span className="w-2 h-2 bg-[#fd79a8] rounded-full mr-2"></span>
                            <span className="text-gray-400 mr-2">{t('matches.phase')}</span>
                            <span>{match.phase}</span>
                          </div>
                          <div className="flex items-center text-gray-300">
                            <span className="w-2 h-2 bg-[#00cec9] rounded-full mr-2"></span>
                            <span className="text-gray-400 mr-2">{t('matches.competition')}</span>
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