import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { motion } from 'framer-motion';
import { featuresAPI, mentorAPI } from '../services/api';
import { Rocket, TrendingUp, Activity, Briefcase, ChevronRight, HelpCircle, Users, MessageSquare } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [aiAdvice, setAiAdvice] = useState('');
  const [activities, setActivities] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Fetch platform stats
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const res = await featuresAPI.stats();
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    // Fetch AI Advice
    featuresAPI.aiAdvice()
      .then(res => setAiAdvice(res.data.data))
      .catch(console.error);

    // Fetch Activity Feed
    featuresAPI.activity()
      .then(res => setActivities(res.data.data || []))
      .catch(console.error);

    // Fetch Trending Questions
    featuresAPI.trending()
      .then(res => setTrending(res.data.data?.trendingQuestions || []))
      .catch(console.error);

    loadStats();

    // Fetch AI Alumni Recommendations (students only)
    if (user?.role === 'student' && user?._id) {
      mentorAPI.getRecommendations(user._id)
        .then(res => setRecommendations(res.data.recommendedMentors || []))
        .catch(console.error);
    }
  }, [user]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      {/* Header and AI Advice */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-muted-foreground mt-2">Here's what's happening in your Alumni Network.</p>
        </div>
        
        {aiAdvice && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/10 border border-primary/20 rounded-xl p-4 max-w-md w-full flex gap-4 items-start">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Rocket size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-primary text-sm mb-1">AI Career Insight</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{aiAdvice}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><Users size={22} /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalAlumni ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Alumni Members</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><HelpCircle size={22} /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalQuestions ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Questions Asked</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><Briefcase size={22} /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalJobs ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ask Question Card */}
        <motion.div variants={item}>
          <Link to="/questions" className="block h-full group">
            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-card hover:to-primary/5">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                  <HelpCircle size={24} />
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
              </CardHeader>
              <CardContent className="flex-1 mt-auto pt-6">
                <CardTitle className="mb-2">Ask Questions</CardTitle>
                <p className="text-sm text-muted-foreground">Get answers from experienced alumni and our NLP engine.</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Directory Card */}
        <motion.div variants={item}>
          <Link to="/alumni" className="block h-full group">
            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-card hover:to-primary/5">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                  <Users size={24} />
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
              </CardHeader>
              <CardContent className="flex-1 mt-auto pt-6">
                <CardTitle className="mb-2">Alumni Directory</CardTitle>
                <p className="text-sm text-muted-foreground">Connect with alumni for 1:1 mentorship and networking.</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Jobs Card */}
        <motion.div variants={item}>
          <Link to="/jobs" className="block h-full group">
            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-card hover:to-primary/5">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                  <Briefcase size={24} />
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
              </CardHeader>
              <CardContent className="flex-1 mt-auto pt-6">
                <CardTitle className="mb-2">{user?.role === 'alumni' ? 'Post a Job' : 'Job Board'}</CardTitle>
                <p className="text-sm text-muted-foreground">{user?.role === 'alumni' ? 'Give back by hiring upcoming students.' : 'Browse internships and full-time opportunities.'}</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>

      {/* Recommended Alumni & Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {user?.role === 'student' && recommendations.length > 0 && (
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-primary" />
              <h3 className="font-bold text-lg">Recommended Mentors</h3>
            </div>
            <div className="flex flex-col gap-3">
              {recommendations.slice(0, 3).map(alumni => (
                <Link key={alumni._id} to={`/alumni/${alumni._id}`}>
                  <Card className="p-4 hover:border-primary/50 transition-colors flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                      {alumni.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{alumni.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{alumni.jobTitle} @ {alumni.company}</p>
                    </div>
                    <div className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                      {alumni.matchScore}% Match
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className={`space-y-4 ${user?.role === 'alumni' || recommendations.length === 0 ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-orange-500" />
            <h3 className="font-bold text-lg">Trending Discussions</h3>
          </div>
          <div className="flex flex-col gap-3">
            {trending.length > 0 ? trending.slice(0, 3).map(question => (
              <Link key={question._id} to={`/question/${question._id}`}>
                <Card className="p-4 hover:border-orange-500/50 transition-colors">
                  <h4 className="font-semibold text-sm line-clamp-2 mb-2">{question.question_text}</h4>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{question.views} views</span>
                    <span>•</span>
                    <span className="text-orange-500">{question.helpful_count} helpful</span>
                  </div>
                </Card>
              </Link>
            )) : <p className="text-sm text-muted-foreground">No trending questions yet.</p>}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={20} className="text-blue-500" />
            <h3 className="font-bold text-lg">Recent Activity</h3>
          </div>
          <Card className="p-0 overflow-hidden">
            <div className="flex flex-col divide-y divide-border">
              {activities.map(act => (
                <div key={act.id} className="p-4 flex gap-3 items-start hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.type === 'job' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {act.type === 'job' ? <Briefcase size={14} /> : <MessageSquare size={14} />}
                  </div>
                  <div>
                    <p className="text-sm">{act.title}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">Recently</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
