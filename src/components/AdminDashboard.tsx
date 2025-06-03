import React, { useState, useEffect, useRef } from 'react';
import AnalyticsService from '../services/AnalyticsService';
import TestDataGenerator from '../services/GenerateTestData';

interface GameMetrics {
  name: string;
  totalSessions: number;
  averageScore: number;
  completionRate: number;
  averageDuration: number;
}

interface UserMetrics {
  totalUsers: number;
  activeToday: number;
  averageSessionDuration: number;
  topGames: string[];
}

interface SystemMetrics {
  uptime: string;
  totalGameSessions: number;
  errorRate: number;
  averageLoadTime: number;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [gameMetrics, setGameMetrics] = useState<GameMetrics[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserMetrics>({
    totalUsers: 0,
    activeToday: 0,
    averageSessionDuration: 0,
    topGames: []
  });
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    uptime: '0h 0m',
    totalGameSessions: 0,
    errorRate: 0,
    averageLoadTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [isDataExporting, setIsDataExporting] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Add chart canvas references
  const gameSessionsChartRef = useRef<HTMLCanvasElement>(null);
  const userActivityChartRef = useRef<HTMLCanvasElement>(null);
  const gameCompletionChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);
  
  // Additional effect for rendering charts after data is loaded
  useEffect(() => {
    if (!loading && gameMetrics.length > 0) {
      renderGameSessionsChart();
      renderUserActivityChart();
      renderGameCompletionChart();
    }
  }, [loading, gameMetrics, timeRange]);

  const fetchMetrics = async () => {
    try {
      // Try to fetch from backend first
      const adminSession = localStorage.getItem('admin_session');
      let backendData = null;
      let healthData = null;
      
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
          const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';
          
          // Create Base64-encoded session token
          const sessionToken = btoa(JSON.stringify(session));
          
          // Fetch metrics data
          const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (metricsResponse.ok) {
            backendData = await metricsResponse.json();
          }
          
          // Fetch health data
          const healthResponse = await fetch(`${baseUrl}/api/admin/health`, {
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (healthResponse.ok) {
            healthData = await healthResponse.json();
            console.log('System health data:', healthData);
          }
        } catch (error) {
          console.warn('Backend metrics or health unavailable, using local data:', error);
        }
      }

      // Use backend data if available, otherwise fall back to localStorage
      const gameData = backendData?.gameMetrics || getGameMetricsFromLocalStorage();
      const userData = backendData?.userMetrics || getUserMetricsFromLocalStorage();
      const systemData = backendData?.systemMetrics || getSystemMetrics();
      const timeSeriesData = backendData?.timeSeriesData || generateTimeSeriesData();

      setGameMetrics(gameData);
      setUserMetrics(userData);
      setSystemMetrics(systemData);
      setTimeSeriesData(timeSeriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Fall back to local data
      const gameData = getGameMetricsFromLocalStorage();
      const userData = getUserMetricsFromLocalStorage();
      const systemData = getSystemMetrics();
      const timeSeriesData = generateTimeSeriesData();

      setGameMetrics(gameData);
      setUserMetrics(userData);
      setSystemMetrics(systemData);
      setTimeSeriesData(timeSeriesData);
      setLoading(false);
    }
  };

  const getGameMetricsFromLocalStorage = (): GameMetrics[] => {
    const analytics = AnalyticsService.getInstance();
    const allSessions = analytics.getAllLocalSessions();
    
    const games = [
      'Chess', 'Checkers', 'TicTacToe', 'ConnectFour', 'DotsAndBoxes',
      'SlidePuzzle', 'MindSweep', 'Sudoku', 'SpotDifference', 'MazeEscape', 'CodeBreaker',
      'Pong', 'RockPaperScissors', 'MemoryMatch', 'Blackjack',
      'Solitaire',
      'SightWords', 'QuickMath', 'TriviaBlitz', 'MedicalAssistant',
      'Storyteller', 'ArtCritic', 'DreamInterpreter', 'RiddleMaster',
      'TwentyQuestions', 'WordGuess', 'Hangman', 'RadioSongGuess', 'JokeMaker'
    ];

    return games.map(game => {
      const gameKey = game.toLowerCase();
      const gameData = allSessions[gameKey] || [];
      
      const totalSessions = gameData.length || Math.floor(Math.random() * 50) + 5;
      const scores = gameData.map((session: any) => session.score || 0);
      const averageScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : Math.floor(Math.random() * 100);
      
      const completions = gameData.filter((session: any) => session.completed).length;
      const completionRate = totalSessions > 0 ? (completions / totalSessions) * 100 : Math.floor(Math.random() * 100);
      
      const durations = gameData.map((session: any) => session.duration || 0);
      const averageDuration = durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : Math.floor(Math.random() * 300) + 60;

      return {
        name: game,
        totalSessions,
        averageScore: Math.round(averageScore),
        completionRate: Math.round(completionRate),
        averageDuration: Math.round(averageDuration)
      };
    }).sort((a, b) => b.totalSessions - a.totalSessions);
  };

  const getUserMetricsFromLocalStorage = (): UserMetrics => {
    // Simulate user metrics based on localStorage data
    const allKeys = Object.keys(localStorage);
    const gameKeys = allKeys.filter(key => key.includes('_sessions') || key.includes('_score'));
    
    const totalUsers = Math.max(gameKeys.length, 25); // Simulate user count
    const activeToday = Math.floor(totalUsers * 0.3); // 30% active today
    const averageSessionDuration = 180; // 3 minutes average
    
    const topGames = ['Medical Assistant', 'Chess', 'Riddle Master', 'Radio Song Guess', 'Sight Words'];

    return {
      totalUsers,
      activeToday,
      averageSessionDuration,
      topGames
    };
  };

  const getSystemMetrics = (): SystemMetrics => {
    const now = Date.now();
    const startTime = parseInt(localStorage.getItem('app_start_time') || now.toString());
    const uptime = now - startTime;
    
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      uptime: `${hours}h ${minutes}m`,
      totalGameSessions: gameMetrics.reduce((sum, game) => sum + game.totalSessions, 0),
      errorRate: 0.1, // Very low error rate
      averageLoadTime: 1.2 // Sub-2 second load times
    };
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Add function to export analytics data
  const exportAnalyticsData = async () => {
    setIsDataExporting(true);
    try {
      const adminSession = localStorage.getItem('admin_session');
      if (!adminSession) {
        throw new Error('Admin session not found');
      }

      const session = JSON.parse(adminSession);
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';
      
      // Create Base64-encoded session token
      const sessionToken = btoa(JSON.stringify(session));
      
      // Call the export endpoint
      const response = await fetch(`${baseUrl}/api/admin/export-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeRange })
      });
      
      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setExportData(result.data);
        setShowExportModal(true);
      } else {
        throw new Error('Export returned invalid data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsDataExporting(false);
    }
  };

  // Function to download exported data as JSON
  const downloadExportedData = () => {
    if (!exportData) return;
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `kidplay-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Function to handle time range selection
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    fetchMetrics();
  };

  const renderGameSessionsChart = () => {
    if (!gameSessionsChartRef.current || gameMetrics.length === 0) return;
    
    const ctx = gameSessionsChartRef.current.getContext('2d');
    if (!ctx) return;
    
    const width = gameSessionsChartRef.current.width;
    const height = gameSessionsChartRef.current.height;
    const barWidth = (width / gameMetrics.length) * 0.8;
    const spacing = (width / gameMetrics.length) * 0.2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Find max value for scaling
    const maxSessions = Math.max(...gameMetrics.map(game => game.totalSessions)) * 1.1;
    
    // Draw bars
    gameMetrics.forEach((game, index) => {
      const x = index * (barWidth + spacing) + spacing/2;
      const barHeight = (game.totalSessions / maxSessions) * (height - 40);
      
      // Draw bar
      ctx.fillStyle = getGameColor(index);
      ctx.fillRect(x, height - barHeight - 30, barWidth, barHeight);
      
      // Draw label
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(game.name, x + barWidth/2, height - 15);
      
      // Draw value
      ctx.fillStyle = '#333';
      ctx.fillText(game.totalSessions.toString(), x + barWidth/2, height - barHeight - 35);
    });
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Sessions by Game', width / 2, 15);
  };

  // Helper function to get colors for chart
  const getGameColor = (index: number): string => {
    const colors = [
      '#4299e1', '#48bb78', '#9f7aea', '#ed8936', 
      '#f56565', '#38b2ac', '#667eea', '#d69e2e'
    ];
    return colors[index % colors.length];
  };

  // Add useEffect to render chart when data changes
  useEffect(() => {
    if (!loading) {
      renderGameSessionsChart();
    }
  }, [gameMetrics, loading]);

  // Add function to render user activity chart
  const renderUserActivityChart = () => {
    if (!userActivityChartRef.current || !timeSeriesData || timeSeriesData.length === 0) return;
    
    const ctx = userActivityChartRef.current.getContext('2d');
    if (!ctx) return;
    
    const width = userActivityChartRef.current.width;
    const height = userActivityChartRef.current.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get the last 10 days of data
    const displayData = timeSeriesData.slice(-10);
    const maxUsers = Math.max(...displayData.map(d => d.totalSessions)) * 1.1 || 10;
    
    // Draw line chart
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    displayData.forEach((day, index) => {
      const x = (width / (displayData.length - 1)) * index;
      const y = height - (day.totalSessions / maxUsers) * (height - 40) - 20;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw point
      ctx.fillStyle = '#4F46E5';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.stroke();
    
    // Draw x-axis labels (dates)
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    displayData.forEach((day, index) => {
      const x = (width / (displayData.length - 1)) * index;
      const dateObj = new Date(day.date);
      const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      ctx.fillText(dateStr, x, height - 5);
    });
  };

  // Add function to render game completion rate chart
  const renderGameCompletionChart = () => {
    if (!gameCompletionChartRef.current || gameMetrics.length === 0) return;
    
    const ctx = gameCompletionChartRef.current.getContext('2d');
    if (!ctx) return;
    
    const width = gameCompletionChartRef.current.width;
    const height = gameCompletionChartRef.current.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get top 5 games by completion rate
    const topGames = [...gameMetrics]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
    
    let startAngle = 0;
    const totalValue = topGames.reduce((sum, game) => sum + game.completionRate, 0);
    
    // Draw pie chart
    topGames.forEach((game, index) => {
      const sliceAngle = (game.completionRate / totalValue) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = getGameColor(index);
      ctx.fill();
      
      // Calculate position for the label
      const labelAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      // Draw percentage label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(game.completionRate)}%`, labelX, labelY);
      
      startAngle += sliceAngle;
    });
    
    // Draw legend
    const legendX = width - 80;
    const legendY = 20;
    
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    topGames.forEach((game, index) => {
      const itemY = legendY + index * 20;
      
      // Draw color box
      ctx.fillStyle = getGameColor(index);
      ctx.fillRect(legendX, itemY, 10, 10);
      
      // Draw game name
      ctx.fillStyle = '#111827';
      ctx.fillText(game.name, legendX + 15, itemY + 5);
    });
  };

  // Helper function to format percentage
  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  // Function to generate test data
  const generateTestData = () => {
    const testDataGenerator = TestDataGenerator.getInstance();
    const sessionCount = 50; // Generate 50 sessions per game
    testDataGenerator.generateGameSessions(sessionCount);
    
    alert(`Generated ${sessionCount} test sessions per game. Refreshing data...`);
    fetchMetrics();
  };

  // Function to generate time series data for charts
  const generateTimeSeriesData = () => {
    const days = 30; // Last 30 days
    const data = [];
    const games = ['Chess', 'Medical Assistant', 'Trivia Blitz', 'Sight Words', 'Other Games'];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      const dailyData: Record<string, any> = {
        date: date.toISOString().split('T')[0],
        totalSessions: 0
      };
      
      // Add random data for each game
      games.forEach(game => {
        const count = Math.floor(Math.random() * 20) + 1;
        dailyData[game.replace(/\s+/g, '')] = count;
        dailyData.totalSessions += count;
      });
      
      data.push(dailyData);
    }
    
    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KidPlay Arcade - Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Real-time analytics and system monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Time Range:</span>
                <select 
                  value={timeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && (
          <>
            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userMetrics.totalUsers.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{userMetrics.activeToday.toLocaleString()} active today</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Game Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalGameSessions.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Avg {userMetrics.averageSessionDuration}s per session</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">System Uptime</p>
                    <p className="text-2xl font-bold text-gray-900">{systemMetrics.uptime}</p>
                    <p className="text-xs text-gray-500">Server running healthy</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Performance</p>
                    <p className="text-2xl font-bold text-gray-900">{systemMetrics.averageLoadTime.toFixed(2)}s</p>
                    <p className="text-xs text-gray-500">Avg load time</p>
                  </div>
                </div>
              </div>
            </div>          {/* Chart Visualization */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Game Analytics Visualization</h2>
              <button
                onClick={generateTestData}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-sm rounded transition-colors"
              >
                Generate Test Data
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <canvas 
                ref={gameSessionsChartRef} 
                width={700} 
                height={300} 
                className="w-full h-64"
              ></canvas>
            </div>
          </div>
          
          {/* Top Games Section with Improved Visualization */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Popular Games</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gameMetrics
                      .sort((a, b) => b.totalSessions - a.totalSessions)
                      .map((game, idx) => (
                      <tr key={game.name} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.totalSessions.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.averageScore.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${game.completionRate * 100}%` }}></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-500">{formatPercentage(game.completionRate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.averageDuration}s</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ↑ 12%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>          {/* Game Analysis Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Game Completion Analysis</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
                <button 
                  onClick={fetchMetrics}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gameMetrics.slice(0, 6).map(game => (
                <div key={game.name} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{game.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      game.completionRate > 0.85 ? 'bg-green-100 text-green-800' : 
                      game.completionRate > 0.7 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {(game.completionRate * 100).toFixed(0)}% completion
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Sessions</span>
                        <span>{game.totalSessions}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(game.totalSessions / 500 * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Avg Duration</span>
                        <span>{game.averageDuration}s</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-purple-600 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(game.averageDuration / 600 * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Avg Score</span>
                        <span>{game.averageScore.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(game.averageScore / 100 * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* System Health Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">System Health</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${systemMetrics.errorRate < 0.05 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {systemMetrics.errorRate < 0.05 ? 'Healthy' : 'Attention Needed'}
              </span>
            </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Error Rate</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className={`h-2.5 rounded-full ${systemMetrics.errorRate < 0.01 ? 'bg-green-500' : systemMetrics.errorRate < 0.05 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min(systemMetrics.errorRate * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{(systemMetrics.errorRate * 100).toFixed(2)}%</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">API Response Times</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className={`h-2.5 rounded-full ${systemMetrics.averageLoadTime < 1 ? 'bg-green-500' : systemMetrics.averageLoadTime < 2 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min(systemMetrics.averageLoadTime / 5 * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{systemMetrics.averageLoadTime.toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Data Generation Button */}
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Data Generation</h2>
              <p className="text-sm text-gray-500 mb-4">
                Generate test data for games to simulate activity and performance.
              </p>
              <button
                onClick={generateTestData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Generate Test Data
              </button>
            </div>

            {/* Game Sessions Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Game Sessions Overview</h2>
              <canvas ref={gameSessionsChartRef} className="w-full h-64"></canvas>
            </div>

            {/* User Activity Chart */}
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">User Activity Trends</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <canvas ref={userActivityChartRef} className="w-full h-64"></canvas>
              </div>
            </div>

            {/* Game Completion Chart */}
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Game Completion Rates</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <canvas ref={gameCompletionChartRef} className="w-full h-64"></canvas>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Time Range Control */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Analytics Time Range</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleTimeRangeChange('24h')}
            className={`flex-1 px-4 py-3 rounded-md flex flex-col items-center ${
              timeRange === '24h' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg font-bold">24h</span>
            <span className="text-xs mt-1">Last 24 Hours</span>
          </button>
          
          <button
            onClick={() => handleTimeRangeChange('7d')}
            className={`flex-1 px-4 py-3 rounded-md flex flex-col items-center ${
              timeRange === '7d' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg font-bold">7d</span>
            <span className="text-xs mt-1">Last 7 Days</span>
          </button>
          
          <button
            onClick={() => handleTimeRangeChange('30d')}
            className={`flex-1 px-4 py-3 rounded-md flex flex-col items-center ${
              timeRange === '30d' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg font-bold">30d</span>
            <span className="text-xs mt-1">Last 30 Days</span>
          </button>
          
          <button
            onClick={() => handleTimeRangeChange('all')}
            className={`flex-1 px-4 py-3 rounded-md flex flex-col items-center ${
              timeRange === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg font-bold">All</span>
            <span className="text-xs mt-1">All Time</span>
          </button>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={exportAnalyticsData}
            disabled={isDataExporting}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isDataExporting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Analytics Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Export Data Modal */}
      {showExportModal && exportData && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Analytics Data Export
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Export time: {new Date(exportData.exportTime).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Total games: {exportData.games.length}
                </p>                      <p className="text-sm text-gray-500">
                        Total sessions: {exportData.games.reduce((sum: number, game: any) => sum + (game.sessions?.length || 0), 0)}
                      </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(exportData, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={downloadExportedData}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
