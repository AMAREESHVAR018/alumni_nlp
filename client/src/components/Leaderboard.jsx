import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { featuresAPI } from '../services/api';
import { Trophy, Medal, Star, TrendingUp, Users, HelpCircle } from 'lucide-react';

const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
const rankLabels = ['🥇', '🥈', '🥉'];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function PodiumCard({ person, rank, isMentor }) {
  const heights = ['h-36', 'h-28', 'h-24'];
  const sizes = ['w-20 h-20 text-3xl', 'w-16 h-16 text-2xl', 'w-14 h-14 text-xl'];

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center gap-2"
    >
      <div className={`${sizes[rank]} rounded-full bg-primary/10 border-4 border-card flex items-center justify-center font-bold text-primary shadow-lg`}
        style={{ borderColor: rankColors[rank] }}>
        {person.name.charAt(0)}
      </div>
      <span className="text-sm font-semibold text-foreground text-center max-w-[100px] leading-tight">{person.name}</span>
      <span className="text-xs text-muted-foreground text-center">
        {isMentor ? person.company : person.department}
      </span>
      <div className={`${heights[rank]} w-full rounded-t-lg flex flex-col items-center justify-end pb-3 pt-2`}
        style={{ background: `${rankColors[rank]}18`, border: `2px solid ${rankColors[rank]}40` }}>
        <span className="text-2xl">{rankLabels[rank]}</span>
        <span className="text-lg font-bold text-foreground">
          {isMentor ? person.answersGiven : (person.questionsAsked + person.upvotes)}
        </span>
        <span className="text-xs text-muted-foreground">{isMentor ? 'answers' : 'points'}</span>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState('mentors');
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try dedicated leaderboard endpoint first, fallback to trending
        let lb = null;
        try {
          const res = await featuresAPI.leaderboard();
          lb = res.data?.data?.leaderboard || res.data?.leaderboard || res.data?.data;
        } catch {
          const res = await featuresAPI.trending();
          lb = res.data?.data?.leaderboard || res.data?.leaderboard;
        }

        if (lb?.mentors?.length) setMentors(lb.mentors);
        if (lb?.students?.length) setStudents(lb.students);

        if (!lb?.mentors?.length && !lb?.students?.length) {
          setError('No leaderboard data available yet.');
        }
      } catch {
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchLeaderboard();
  }, [token]);

  const list = tab === 'mentors' ? mentors : students;
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Trophy size={24} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Top contributors in the community</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }}
        className="flex bg-muted rounded-xl p-1 gap-1">
        {[
          { key: 'mentors', label: 'Top Mentors', icon: Medal },
          { key: 'students', label: 'Top Students', icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-muted-foreground">
          <HelpCircle size={48} className="mx-auto mb-4 opacity-20" />
          <p>{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Podium Top 3 */}
            {top3.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-6 text-center tracking-wider">Top 3</h3>
                <div className="flex items-end justify-center gap-4">
                  {/* Render order: 2nd, 1st, 3rd */}
                  {[1, 0, 2].filter(i => top3[i]).map(i => (
                    <div key={i} className="flex-1 max-w-[120px]">
                      <PodiumCard person={top3[i]} rank={i} isMentor={tab === 'mentors'} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Full Rankings</h3>
                </div>
                <div className="divide-y divide-border">
                  {rest.map((person, i) => {
                    const rank = i + 4;
                    const score = tab === 'mentors' ? person.answersGiven : (person.questionsAsked + person.upvotes);
                    return (
                      <motion.div
                        key={person._id || i}
                        variants={itemVariants}
                        className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                      >
                        <span className="w-8 text-center text-sm font-bold text-muted-foreground">#{rank}</span>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                          {person.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{person.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tab === 'mentors' ? (person.company || 'Alumni') : (person.department || 'Student')}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-foreground">{score}</p>
                          <p className="text-xs text-muted-foreground">{tab === 'mentors' ? 'answers' : 'points'}</p>
                        </div>
                        {tab === 'mentors' && person.matchScore && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary flex-shrink-0">
                            <Star size={10} /> {person.matchScore}%
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {list.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No data available yet.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
