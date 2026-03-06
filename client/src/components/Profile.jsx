import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI, featuresAPI, questionAPI } from '../services/api';
import { Edit3, MapPin, Briefcase, BookOpen, MessageSquare, HelpCircle, CheckCircle, Star, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const Tag = ({ label, color = 'primary' }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${color}/10 text-${color} border border-${color}/20`}>
    {label}
  </span>
);

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    variants={fadeUp}
    className="flex flex-col items-center gap-1 bg-card border border-border rounded-xl p-4 flex-1 min-w-[100px]"
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${color}/10`}>
      <Icon size={20} className={`text-${color}`} />
    </div>
    <span className="text-2xl font-bold text-foreground">{value ?? '—'}</span>
    <span className="text-xs text-muted-foreground text-center">{label}</span>
  </motion.div>
);

export default function Profile() {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(user);
  const [activity, setActivity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    career_goals: user?.career_goals || '',
    skills: user?.skills?.join(', ') || '',
    linkedinUrl: user?.linkedinUrl || '',
  });

  useEffect(() => {
    if (!token) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, actRes, postsRes] = await Promise.allSettled([
          authAPI.getProfile(),
          featuresAPI.activity(),
          user?.role === 'alumni'
            ? questionAPI.getAllQuestions({ answered: true, limit: 5 })
            : questionAPI.getMyQuestions({ limit: 5 }),
        ]);

        if (profileRes.status === 'fulfilled') {
          const fresh = profileRes.value.data?.data;
          if (fresh) {
            setProfileData(fresh);
            setEditForm({
              name: fresh.name || '',
              bio: fresh.bio || '',
              career_goals: fresh.career_goals || '',
              skills: fresh.skills?.join(', ') || '',
              linkedinUrl: fresh.linkedinUrl || '',
            });
          }
        }
        if (actRes.status === 'fulfilled') setActivity(actRes.value.data?.data || actRes.value.data);
        if (postsRes.status === 'fulfilled') {
          const d = postsRes.value.data?.data || postsRes.value.data;
          setPosts(Array.isArray(d) ? d.slice(0, 5) : []);
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSaveEdit = async () => {
    try {
      const payload = {
        name: editForm.name,
        bio: editForm.bio,
        career_goals: editForm.career_goals,
        skills: editForm.skills ? editForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        linkedinUrl: editForm.linkedinUrl,
      };
      const res = await authAPI.updateProfile(payload);
      const updated = res.data?.data;
      if (updated) {
        setProfileData(updated);
        // Persist updated user in localStorage so context stays in sync
        localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
      }
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const avatarLetter = profileData?.name?.charAt(0)?.toUpperCase() || '?';

  const stats = [
    { icon: HelpCircle, label: 'Questions Asked', value: activity?.questionsAsked ?? 0, color: 'blue-500' },
    { icon: CheckCircle, label: profileData?.role === 'alumni' ? 'Answers Given' : 'Upvotes Received', value: activity?.answersGiven ?? activity?.upvotesReceived ?? 0, color: 'green-500' },
    { icon: MessageSquare, label: 'Messages Sent', value: activity?.messagesSent ?? 0, color: 'primary' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="bg-card border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden"
      >
        {/* Gradient Banner */}
        <div className="absolute inset-0 h-28 bg-gradient-to-r from-primary/20 to-primary/5 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 pt-10 sm:pt-6">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-lg border-4 border-card"
          >
            {avatarLetter}
          </motion.div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-foreground">{profileData?.name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                profileData?.role === 'alumni' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                {profileData?.role === 'alumni' ? '🎓 Alumni' : '📚 Student'}
              </span>
              {profileData?.department && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen size={12} /> {profileData.department}
                </span>
              )}
              {profileData?.company && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase size={12} /> {profileData.company}
                </span>
              )}
            </div>
            {profileData?.jobTitle && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 justify-center sm:justify-start">
                <MapPin size={13} /> {profileData.jobTitle}
              </p>
            )}
            {profileData?.linkedinUrl && (
              <a
                href={profileData.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 justify-center sm:justify-start"
              >
                <LinkIcon size={12} /> LinkedIn Profile
              </a>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Edit3 size={15} /> Edit Profile
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="flex gap-3 flex-wrap"
      >
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </motion.div>

      {/* About */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">About</h2>
        {profileData?.bio && (
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Bio</p>
            <p className="text-sm text-foreground leading-relaxed">{profileData.bio}</p>
          </div>
        )}
        {profileData?.career_goals && (
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Career Goals</p>
            <p className="text-sm text-foreground leading-relaxed">{profileData.career_goals}</p>
          </div>
        )}
        {profileData?.skills?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((s) => <Tag key={s} label={s} color="primary" />)}
            </div>
          </div>
        )}
        {profileData?.interests?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {profileData.interests.map((i) => <Tag key={i} label={i} color="green-500" />)}
            </div>
          </div>
        )}
        {!profileData?.bio && !profileData?.career_goals && !profileData?.skills?.length && !profileData?.interests?.length && (
          <p className="text-sm text-muted-foreground">No details added yet. Click "Edit Profile" to add info.</p>
        )}
      </motion.div>

      {/* Posts / Questions */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Star size={18} className="text-primary" />
          {profileData?.role === 'alumni' ? 'Recently Answered Questions' : 'My Questions'}
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((q, i) => (
              <motion.div
                key={q._id || i}
                custom={i}
                variants={fadeUp}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HelpCircle size={15} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{q.question_text || q.title || q.question}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.answers?.length ?? 0} answers · {q.helpful_count ?? q.upvotes ?? 0} helpful
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold text-foreground">Edit Profile</h3>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Name</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="A short bio about yourself"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Career Goals</label>
                <textarea
                  value={editForm.career_goals}
                  onChange={e => setEditForm(f => ({ ...f, career_goals: e.target.value }))}
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="What are your career goals?"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Skills (comma-separated)</label>
                <input
                  value={editForm.skills}
                  onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="React, Python, Node.js"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={editForm.linkedinUrl}
                  onChange={e => setEditForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
