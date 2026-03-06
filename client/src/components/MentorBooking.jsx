import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { featuresAPI, mentorAPI } from '../services/api';
import { GraduationCap, CalendarDays, Clock, MessageSquare, CheckCircle, ChevronRight, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';

const slideIn = {
  hidden: { x: 40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
  exit: { x: 40, opacity: 0, transition: { duration: 0.2 } },
};

const listItem = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07 } }),
};

function MentorCard({ mentor, selected, onClick, index }) {
  const score = mentor.similarity ?? mentor.matchScore ?? null;
  return (
    <motion.div
      custom={index}
      variants={listItem}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg flex-shrink-0">
          {mentor.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{mentor.name}</span>
            {score !== null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {Math.round(score * 100 > 1 ? score : score * 100)}% match
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mentor.jobTitle || mentor.jobRole} · {mentor.company}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(mentor.skills || []).slice(0, 4).map(s => (
              <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                {s}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight size={16} className={`text-muted-foreground mt-1 transition-transform ${selected ? 'rotate-90 text-primary' : ''}`} />
      </div>
    </motion.div>
  );
}

export default function MentorBooking() {
  const { user, token } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ date: '', time: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const isAlumni = user?.role === 'alumni';

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (isAlumni) {
          const res = await featuresAPI.bookings();
          setBookings(res.data?.data || res.data || []);
        } else {
          const userId = user?._id || user?.id;
          const res = userId
            ? await mentorAPI.getRecommendations(userId)
            : await featuresAPI.activity(); // fallback — won't return mentors
          const data = res.data?.data || res.data;
          const mentorList = Array.isArray(data)
            ? data
            : data?.recommendedMentors || [];
          setMentors(mentorList);
          if (mentorList.length === 0) {
            toast('No mentor recommendations found. Check back later.', { icon: 'ℹ️' });
          }
        }
      } catch (err) {
        console.error('MentorBooking fetch error:', err);
        toast.error('Failed to load mentor data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, isAlumni, user]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedMentor || !form.date || !form.time) {
      toast.error('Please select a date and time');
      return;
    }
    setSubmitting(true);
    try {
      await featuresAPI.bookMentor({
        mentorId: selectedMentor._id,
        date: form.date,
        time: form.time,
        message: form.message,
      });
      toast.success(`Session booked with ${selectedMentor.name}! 🎉`);
      setForm({ date: '', time: '', message: '' });
      setSelectedMentor(null);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Alumni view
  if (isAlumni) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mentor Dashboard</h1>
            <p className="text-sm text-muted-foreground">Students are reaching out for your guidance</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <GraduationCap size={40} className="mx-auto text-primary mb-3" />
          <h2 className="text-lg font-semibold text-foreground">Share Your Knowledge</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Students can book sessions with you. Keep your profile updated to get the best matches.
          </p>
        </motion.div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Inbox size={18} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm text-foreground">Pending Booking Requests</h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Inbox size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No pending bookings yet. Students will appear here when they book a session.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {bookings.map((b, i) => (
                <motion.div key={b._id || i} custom={i} variants={listItem} initial="hidden" animate="visible"
                  className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                    {b.student?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{b.student?.name || 'Student'}</p>
                    <p className="text-xs text-muted-foreground">{b.date} at {b.time}</p>
                    {b.message && <p className="text-xs text-muted-foreground mt-0.5 italic">"{b.message}"</p>}
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {b.status || 'pending'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Student view
  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <GraduationCap size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book a Mentor</h1>
          <p className="text-sm text-muted-foreground">Connect with alumni mentors for guidance</p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Mentor List */}
        <div className="lg:w-[55%] space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recommended Mentors</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <motion.div variants={{ visible: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="visible" className="space-y-3">
              {mentors.map((mentor, i) => (
                <MentorCard
                  key={mentor._id || i}
                  mentor={mentor}
                  index={i}
                  selected={selectedMentor?._id === mentor._id}
                  onClick={() => setSelectedMentor(selectedMentor?._id === mentor._id ? null : mentor)}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Booking Panel */}
        <div className="lg:w-[45%]">
          <AnimatePresence mode="wait">
            {selectedMentor ? (
              <motion.div
                key="booking-form"
                variants={slideIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-card border border-border rounded-2xl overflow-hidden sticky top-4"
              >
                {/* Mentor Summary */}
                <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Booking session with</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center flex-shrink-0">
                      {selectedMentor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedMentor.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedMentor.jobTitle || selectedMentor.jobRole} · {selectedMentor.company}</p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleBook} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                        <CalendarDays size={13} /> Date
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                        <Clock size={13} /> Time
                      </label>
                      <input
                        type="time"
                        required
                        value={form.time}
                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                      <MessageSquare size={13} /> Topic / Message
                    </label>
                    <textarea
                      rows={4}
                      placeholder="What would you like to discuss? (career advice, resume review, technical guidance...)"
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                        </svg>
                        Booking...
                      </span>
                    ) : (
                      <><CheckCircle size={17} /> Confirm Booking</>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden lg:flex flex-col items-center justify-center h-64 bg-card border border-dashed border-border rounded-2xl text-muted-foreground text-center p-6"
              >
                <GraduationCap size={40} className="mb-3 opacity-30" />
                <p className="font-medium text-sm">Select a mentor to book a session</p>
                <p className="text-xs mt-1">Click any mentor card on the left</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
