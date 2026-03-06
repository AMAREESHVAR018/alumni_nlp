import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { ArrowLeft } from 'lucide-react';

const AlumniProfile = () => {
  const { id } = useParams();
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getAlumni(id);
        setAlumni(response.data.data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchAlumni();
  }, [id]);

  if (loading) return (
    <div className="space-y-4 max-w-4xl mx-auto">
       <Skeleton className="h-8 w-32 mb-4" />
       <Skeleton className="h-64 w-full" />
    </div>
  );

  if (error || !alumni) return <div className="text-center text-danger py-10 font-medium">{error || 'Alumni not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/alumni" className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
      </Link>
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-6 mb-8 border-b border-border pb-8">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl uppercase">
              {alumni.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{alumni.name}</h1>
              <p className="text-xl text-muted-foreground font-medium">{alumni.jobTitle} {alumni.company ? `@ ${alumni.company}` : ''}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong className="text-foreground block mb-1">Domain</strong> 
                    {alumni.domain || 'Not specified'}
                  </div>
                  <div>
                    <strong className="text-foreground block mb-1">Experience</strong> 
                    {alumni.yearsOfExperience ? `${alumni.yearsOfExperience}+ years` : 'Not specified'}
                  </div>
                  <div>
                    <strong className="text-foreground block mb-1">Graduation</strong> 
                    {alumni.graduationYear || 'Not specified'}
                  </div>
                </div>
              </div>
              
              {alumni.skills && alumni.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {alumni.skills.map((skill, i) => (
                      <span key={i} className="bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded-md text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
               <div className="bg-secondary/50 p-6 rounded-lg border border-border">
                 <h3 className="text-lg font-semibold text-foreground mb-4">Connect</h3>
                 <Button className="w-full mb-3">Send Message</Button>
                 {alumni.linkedinUrl && (
                   <Button variant="outline" className="w-full">View LinkedIn</Button>
                 )}
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default AlumniProfile;
