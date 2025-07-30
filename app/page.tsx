'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';

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

export default function Home() {
  const { matches, loading, error } = useMatches();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredMatches, setFilteredMatches] = useState(matches);

  // Generate structured data for sports events
  const generateSportsEventStructuredData = () => {
    if (!matches || matches.length === 0) return null;
    
    const events = matches.slice(0, 10).map(match => ({
      "@type": "SportsEvent",
      "name": match.match,
      "description": `${match.phase} - ${match.competition}`,
      "sport": match.category,
      "startDate": `${match.date}T${match.time}`,
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
    }));

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

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(match => match.category === selectedCategory));
    }
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

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-shadow text-white">
              Calendario de
              <br />
              <span className="text-[#6c5ce7]">
                Partidos
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed text-shadow">
              Sigue todos los partidos del equipo de esports KOI en tiempo real.
              <br className="hidden md:block" />
              Nunca te pierdas una competición.
            </p>

            {/* CTA Button */}
            <div className="pt-8">
              <button 
                onClick={() => document.getElementById('matches')?.scrollIntoView({ behavior: 'smooth' })}
                className="koi-button group relative inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105 koi-glow-hover"
              >
                Ver Partidos
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
            <h2 className="text-3xl font-bold mb-4 text-white">Filtrar por Juego</h2>
            <p className="text-gray-300 text-lg">Encuentra los partidos de tu juego favorito</p>
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
                  
                  <span>{category === 'all' ? 'Todos los Juegos' : category}</span>
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
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Cargando partidos...</h3>
              <p className="text-gray-400 text-lg">Obteniendo datos actualizados del calendario</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Error al cargar partidos</h3>
              <p className="text-gray-400 text-lg mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="koi-button px-6 py-3 rounded-lg transition-all duration-300 koi-glow-hover"
              >
                Reintentar
              </button>
            </div>
          ) : filteredMatches.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className="group relative koi-card rounded-2xl p-6 hover:transform hover:scale-[1.02] transition-all duration-500"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getCategoryColor(match.category)}`}>
                        {match.category}
                      </span>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">{match.date}</div>
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
                          <span className="text-gray-400 mr-2">Fase:</span>
                          <span>{match.phase}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <span className="w-2 h-2 bg-[#00cec9] rounded-full mr-3"></span>
                          <span className="text-gray-400 mr-2">Competición:</span>
                          <span>{match.competition}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stream info */}
                      <div className="mt-6 pt-4 border-t border-[#2d3436]/50 group-hover:border-[#6c5ce7]/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-[#fd79a8] rounded-full animate-pulse"></div>
                            <span className="text-gray-400 text-sm">Stream</span>
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50 koi-glow">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No hay partidos</h3>
              <p className="text-gray-400 text-lg">No se encontraron partidos para la categoría seleccionada</p>
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
            
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              Datos extraídos en tiempo real del{' '}
              <a
                href="https://docs.google.com/spreadsheets/u/0/d/1i3ji5iDuACafqPPR0CPGI4ARk6Z2d853KeKcHef2Wto/htmlview?pli=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-violet-400 transition-colors underline underline-offset-4 font-semibold"
              >
                Google Sheet oficial de KOI
              </a>
            </p>
            
            <div className="text-gray-400 max-w-3xl mx-auto mb-6 text-center">
              <p className="mb-3">
                Este es un proyecto de código libre al que cualquiera puede contribuir.
              </p>
              <p className="mb-3">
                Agradecimientos especiales a{' '}
                <a
                  href="https://x.com/aike0070"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-violet-400 transition-colors underline underline-offset-4 font-semibold"
                >
                  @aike0070
                </a>
                {' '}por crear y mantener el sheet de datos.
              </p>
              <p>
                Proyecto desarrollado por{' '}
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
                  Ver en GitHub
                </a>
              </p>
            </div>
            
            <div className="pt-6 text-sm text-gray-500">
              © 2025 KOI Calendar. Diseñado para la comunidad de KOI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
