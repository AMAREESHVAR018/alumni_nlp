import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: '',
    graduationYear: '',
    domain: '',
    skills: '',
    yearsOfExperience: '',
    currentYear: '',
    university: '',
    targetRoles: '',
    interests: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const submitData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role,
      domain: formData.domain || undefined, // Send undefined if empty so backend decides based on schema
    };

    if (role === 'alumni') {
      submitData.company = formData.company;
      submitData.jobTitle = formData.jobTitle;
      submitData.graduationYear = formData.graduationYear ? parseInt(formData.graduationYear) : undefined;
      submitData.skills = formData.skills ? formData.skills.split(',').map(s => s.trim()) : [];
      submitData.yearsOfExperience = formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined;
    } else {
      submitData.currentYear = formData.currentYear ? parseInt(formData.currentYear) : undefined;
      submitData.university = formData.university;
      submitData.targetRoles = formData.targetRoles ? formData.targetRoles.split(',').map(r => r.trim()) : [];
      submitData.interests = formData.interests ? formData.interests.split(',').map(i => i.trim()) : [];
    }

    setLoading(true);
    const result = await register(submitData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">AlumniNet</h1>
        <p className="text-muted-foreground mt-2">Join the digital campus network</p>
      </div>

      <Card className="w-full max-w-xl">
        <CardContent className="pt-8">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md mb-6 text-sm">
              <p className="font-bold mb-1">Registration failed</p>
              <ul className="list-disc pl-5">
                {typeof error === 'string' ? error.split(', ').map((err, index) => (
                  <li key={index}>{err}</li>
                )) : <li>{JSON.stringify(error)}</li>}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Domain/Field</label>
                <Input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g., Software Engineering"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {role === 'alumni' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Company</label>
                    <Input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Job Title</label>
                    <Input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Graduation Year</label>
                    <Input
                      type="number"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Years of Experience</label>
                    <Input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Skills (comma-separated)</label>
                    <Input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="Java, Python, React"
                    />
                  </div>
                </>
              )}

              {role === 'student' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">University</label>
                    <Input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Current Year</label>
                    <Input
                      type="number"
                      name="currentYear"
                      value={formData.currentYear}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Target Roles</label>
                    <Input
                      type="text"
                      name="targetRoles"
                      value={formData.targetRoles}
                      onChange={handleChange}
                      placeholder="Software Engineer, Data Scientist"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Interests</label>
                    <Input
                      type="text"
                      name="interests"
                      value={formData.interests}
                      onChange={handleChange}
                      placeholder="Web Dev, AI/ML, Cloud Computing"
                    />
                  </div>
                </>
              )}
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-6"
            >
              Register
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
